import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
        return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
                getAll() {
                          return request.cookies.getAll().map(({ name, value }) => {
                                      try { return { name, value: decodeURIComponent(value) } } catch { return { name, value } }
                          })
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                          supabaseResponse = NextResponse.next({ request })
                          cookiesToSet.forEach(({ name, value, options }) =>
                                      supabaseResponse.cookies.set(name, value, options)
                                                       )
                },
        },
  })

  const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    const pathname = request.nextUrl.pathname

  // Rotas publicas
  if (pathname.startsWith('/auth') || pathname === '/' || pathname === '/landing') {
        if (user) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', user.id)
                  .single()

          if (profile?.role) {
                    const redirectUrl = profile.role === 'coach' ? '/dashboard' : '/coachee/dashboard'
                    return NextResponse.redirect(new URL(redirectUrl, request.url))
          }
        }
        return supabaseResponse
  }

  // Rotas protegidas
  if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Acesso por role
  const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

  const role = profile?.role ?? 'coachee'

  if (pathname.startsWith('/dashboard') && role !== 'coach') {
        return NextResponse.redirect(new URL('/coachee/dashboard', request.url))
  }

  if (pathname.startsWith('/coachee') && role !== 'coachee') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
    matcher: [
          '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
        ],
}
