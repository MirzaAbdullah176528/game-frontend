'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  Trophy,
  Swords,
  Target,
  TrendingUp,
  LogOut,
  Save,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { userApi, type UserProfile } from '@/lib/api/user.api'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { getRank, RANK_COLORS } from '@/lib/auth'
import { cn } from '@/lib/utils'

const passwordSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type PasswordValues = z.infer<typeof passwordSchema>

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: number | string
  icon: typeof Trophy
  tone?: 'default' | 'emerald' | 'rose' | 'blue'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600 bg-emerald-50'
      : tone === 'rose'
        ? 'text-rose-600 bg-rose-50'
        : tone === 'blue'
          ? 'text-blue-600 bg-blue-50'
          : 'text-primary bg-primary/10'
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div
            className={cn(
              'grid h-10 w-10 place-items-center rounded-md',
              toneClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const p = await userApi.getMyStats()
        if (!cancelled && p) {
          setProfile(p)
          form.reset({
            name: p.username,
            email: p.email,
            password: '',
          })
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not load your profile. Please try again.'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  const onSubmit = async (values: PasswordValues) => {
    setSaving(true)
    setPwError(null)
    try {
      await authApi.updateProfile(values)
      toast.success('Profile updated')
      form.reset({ ...values, password: '' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not update your profile. Please try again.'
      setPwError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex-1 container mx-auto px-4 py-10">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error ?? 'Profile not available'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const rank = getRank(profile.elo)

  return (
    <div className="flex-1 container mx-auto px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  {profile.username}
                  <Badge
                    variant="secondary"
                    className={cn('font-medium', RANK_COLORS[rank])}
                  >
                    {rank}
                  </Badge>
                </CardTitle>
                <CardDescription className="truncate">
                  {profile.email}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="ELO"
            value={profile.elo}
            icon={TrendingUp}
          />
          <StatCard
            label="Games"
            value={profile.games}
            icon={Swords}
          />
          <StatCard
            label="Wins"
            value={profile.wins}
            icon={Trophy}
            tone="emerald"
          />
          <StatCard
            label="Losses"
            value={profile.losses}
            icon={Target}
            tone="rose"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Draws"
            value={profile.draws}
            icon={Swords}
            tone="blue"
          />
          <StatCard
            label="Win rate"
            value={profile.win_rate}
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Rank"
            value={`#${profile.rank || '—'}`}
            icon={Trophy}
          />
        </div>

        {/* Tabs: edit profile / play */}
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit profile</TabsTrigger>
            <TabsTrigger value="play">Play</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Update profile</CardTitle>
                <CardDescription>
                  Change your username, email, or password. The backend
                  requires your current password to be re-entered.
                </CardDescription>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <CardContent className="space-y-4">
                  {pwError && (
                    <Alert variant="destructive">
                      <AlertDescription>{pwError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Username</Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      {...form.register('password')}
                    />
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="play">
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>
                  Jump back into a match or check where you stand.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/ttt">Play Tic-Tac-Toe</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/leaderboard">Leaderboard</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
