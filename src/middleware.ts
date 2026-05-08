import { NextResponse, type NextRequest } from 'next/server'

function parseAuthSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
  if (!projectRef) return null
  const rawValue = request.cookies.get(`sb-${projectRef}-auth-token`)?.value
  if (!rawValue) return null
  try {
    const decoded = rawValue.includes('%7B') || rawValue.includes('%22')
      ? decodeURIComponent(rawValue)
      : rawValue
    const session = JSON.parse(decoded)
    const now = Math.floor(Date.now() / 1000)
    if (!session?.user || !session.expires_at || session.expires_at <= now) return null
    return session
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const session = parseAuthSession(request)
  const user = session?.user ?? null
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/auth') || pathname === '/' || pathname === '/landing') {
    if (user) {
      const role = user.user_metadata?.role ?? 'coachee'
      const redirectUrl = role === 'coach' ? '/dashboard' : '/coachee/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.next()
  }

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const role = user.user_metadata?.role ?? 'coachee'

  if (pathname.startsWith('/dashboard') && role !== 'coach') {
    return NextResponse.redirect(new URL('/coachee/dashboard', request.url))
  }

  if (pathname.startsWith('/coachee') && role !== 'coachee') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
