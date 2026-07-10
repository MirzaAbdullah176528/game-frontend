export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://raspy-disk-bc7e.ajjh564356165649.workers.dev'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const ACCESS_TOKEN_KEY = 'game_access_token'

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  set(token: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clear(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Send Authorization header. Default true. */
  auth?: boolean
  /** Skip auto-refresh on 401. Default false. */
  skipRefresh?: boolean
  /** Custom headers. */
  headers?: Record<string, string>
  /** AbortSignal. */
  signal?: AbortSignal
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) return null
      const data = (await res.json()) as { accessToken?: string }
      if (!data.accessToken) return null
      tokenStore.set(data.accessToken)
      return data.accessToken
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

/** Human-readable message for a non-200 status, when the body has none. */
function statusFallback(status: number): string {
  switch (status) {
    case 400:
      return 'The request was invalid. Please check your input and try again.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return 'The resource you requested could not be found.'
    case 409:
      return 'That resource already exists.'
    case 410:
      return 'This resource is no longer available.'
    case 422:
      return 'The data you submitted was not valid.'
    case 429:
      return 'Too many requests. Please slow down and try again shortly.'
    case 500:
      return 'The server had an internal error. Please try again.'
    case 502:
    case 503:
    case 504:
      return 'The server is unreachable or temporarily down. Please try again later.'
    default:
      return `Request failed (HTTP ${status}).`
  }
}

/** Translate a fetch() TypeError into a user-facing message. */
function networkErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()
  if (lower.includes('failed to fetch')) {
    return 'Could not reach the server. It may be offline, or your browser may be blocking the request (CORS). Please check your connection and try again.'
  }
  if (lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Network error — please check your internet connection and try again.'
  }
  if (lower.includes('aborted') || lower.includes('timeout')) {
    return 'The request took too long and was aborted. Please try again.'
  }
  if (lower.includes('cors')) {
    return 'The request was blocked by CORS policy. The backend may not allow requests from this origin.'
  }
  return raw || 'An unexpected network error occurred.'
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    skipRefresh = false,
    headers = {},
    signal,
  } = options

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = tokenStore.get()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  const init: RequestInit = {
    method,
    headers: finalHeaders,
    credentials: 'include',
    signal,
  }

  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(url, init)
  } catch (err) {
    // fetch() only throws on network-level failures (DNS, CORS, offline, abort).
    throw new ApiError(networkErrorMessage(err), 0, err)
  }

  // Auto-refresh on 401 — try once, then give up.
  if (res.status === 401 && auth && !skipRefresh) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      finalHeaders['Authorization'] = `Bearer ${newToken}`
      try {
        res = await fetch(url, { ...init, headers: finalHeaders })
      } catch (err) {
        throw new ApiError(networkErrorMessage(err), 0, err)
      }
    } else {
      tokenStore.clear()
    }
  }

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  let parsed: unknown = null
  if (isJson) {
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
  }

  if (!res.ok) {
    let message: string | null = null

    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      // Common backend shapes: { message }, { error }, { error: { message } }, Zod's { formErrors }
      if (typeof obj.message === 'string') {
        message = obj.message
      } else if (typeof obj.error === 'string') {
        message = obj.error
      } else if (
        obj.error &&
        typeof obj.error === 'object' &&
        typeof (obj.error as Record<string, unknown>).message === 'string'
      ) {
        message = (obj.error as Record<string, unknown>).message as string
      } else if (obj.formErrors && typeof obj.formErrors === 'object') {
        // Hono zodValidator flatten() output
        message = 'Some fields were invalid. Please review and try again.'
      }
    } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
      message = parsed
    }

    throw new ApiError(message ?? statusFallback(res.status), res.status, parsed)
  }

  // Some endpoints return empty 204; allow callers to receive {} instead of null.
  return (parsed ?? ({} as T)) as T
}

export const apiClient = {
  get: <T = unknown>(path: string, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T = unknown>(path: string, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
}
