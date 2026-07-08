import { apiClient } from './client'

export type AuthUser = {
  id: number
  name: string
  email: string
}

export type SignUpInput = {
  name: string
  email: string
  password: string // min 8 chars (validated on backend)
}

export type LoginInput = {
  name: string
  password: string
}

export type VerifyOtpInput = {
  name: string
  otp: string
}

export type VerifyResponse = {
  message: string
  accessToken: string
  user: AuthUser
}

export type RefreshResponse = {
  accessToken: string
  status: 'success'
}

export type UpdateProfileInput = {
  name: string
  email: string
  password: string
}

export const authApi = {
  signUp: (input: SignUpInput) =>
    apiClient.post<{ message: string }>('/auth/sign-up', input),

  login: (input: LoginInput) =>
    apiClient.post<{ token: string }>('/auth/login', input),

  verify: (input: VerifyOtpInput) =>
    apiClient.post<VerifyResponse>('/auth/verify', input),

  requestOtp: (email: string) =>
    apiClient.post<{ message: string }>('/auth/otp', { email }),

  refresh: () =>
    apiClient.post<RefreshResponse>('/auth/refresh', undefined, {
      skipRefresh: true,
    }),

  logout: () =>
    apiClient.post<{ status: string; message: string }>('/auth/logout', undefined),

  updateProfile: (input: UpdateProfileInput) =>
    apiClient.patch<{ status: string }>('/auth/update-profile', input),
}
