'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Client-side guard for protected routes.
 * Redirects to /login if no user is found after hydration.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, hydrated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login')
    }
  }, [hydrated, user, router])

  if (!hydrated || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
