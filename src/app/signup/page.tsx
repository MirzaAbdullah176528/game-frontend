'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, UserPlus, Mail, KeyRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

// ---- Step 1: sign-up form ----
const signUpSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type SignUpValues = z.infer<typeof signUpSchema>

// ---- Step 2: OTP verify ----
const verifySchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP is 6 digits')
    .regex(/^\d{6}$/, 'OTP must be digits only'),
})
type VerifyValues = z.infer<typeof verifySchema>

type Step = 'form' | 'otp'

export default function SignupPage() {
  const router = useRouter()
  const { setToken } = useAuthStore()

  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Carry registration values into the OTP step
  const [registered, setRegistered] = useState<{
    name: string
    email: string
  } | null>(null)

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const verifyForm = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: '' },
  })

  // --- Step 1 submit ---
  const onSignUp = async (values: SignUpValues) => {
    setSubmitting(true)
    setFormError(null)
    try {
      await authApi.signUp(values)
      setRegistered({ name: values.name, email: values.email })
      setStep('otp')
      toast.success('Verification code sent', {
        description: `Check ${values.email} — the code expires in 10 minutes.`,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign-up failed. Please try again.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Step 2 submit ---
  const onVerify = async (values: VerifyValues) => {
    if (!registered) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await authApi.verify({
        name: registered.name,
        otp: values.otp,
      })
      setToken(res.accessToken)
      toast.success('Account verified!', {
        description: 'You are now signed in.',
      })
      router.push('/ttt')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Verification failed. Please try again.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Resend OTP ---
  const onResend = async () => {
    if (!registered) return
    setResending(true)
    setFormError(null)
    try {
      await authApi.requestOtp(registered.email)
      toast.success('A new code has been sent to your email.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not resend the code. Please try again.'
      setFormError(message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              {step === 'form' ? (
                <UserPlus className="h-6 w-6" />
              ) : (
                <KeyRound className="h-6 w-6" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'form'
              ? 'Enter your details below to create your account'
              : `We sent a 6-digit code to ${registered?.email ?? 'your email'}`}
          </CardDescription>
        </CardHeader>

        {formError && (
          <div className="px-6">
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={signUpForm.handleSubmit(onSignUp)} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  placeholder="your_username"
                  autoComplete="username"
                  {...signUpForm.register('name')}
                />
                {signUpForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {signUpForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...signUpForm.register('email')}
                />
                {signUpForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  {...signUpForm.register('password')}
                />
                {signUpForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center w-full">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline mt-5"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={verifyForm.handleSubmit(onVerify)} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  {...verifyForm.register('otp')}
                />
                {verifyForm.formState.errors.otp && (
                  <p className="text-xs text-destructive">
                    {verifyForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center text-sm text-muted-foreground gap-1">
                <Mail className="h-4 w-4" />
                <span>Didn&apos;t get it?</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="px-1"
                  disabled={resending}
                  onClick={onResend}
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify & continue'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('form')
                  setFormError(null)
                  verifyForm.reset()
                }}
              >
                ← Use a different email
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
