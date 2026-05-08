import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', request.url))
  }

  // Redirect based on role
  let { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_step')
    .eq('id', data.user.id)
    .single()

  // Create profile if it doesn't exist (first login after email confirmation)
  if (!profile) {
    const meta = data.user.user_metadata
    const newProfile = {
      id: data.user.id,
      full_name: meta?.full_name || '',
      role: (meta?.role as string) || 'coachee',
      onboarding_step: 'profile',
    }
    await supabase.from('profiles').insert(newProfile)
    profile = { role: newProfile.role, onboarding_step: newProfile.onboarding_step }
  }

  if (next !== '/') {
    return NextResponse.redirect(new URL(next, request.url))
  }

  if (profile?.role === 'coach') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const step = profile?.onboarding_step
  if (step && step !== 'completed') {
    return NextResponse.redirect(new URL(`/coachee/onboarding/${step}`, request.url))
  }

  return NextResponse.redirect(new URL('/coachee/dashboard', request.url))
}
