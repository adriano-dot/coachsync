import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const all = cookieStore.getAll()
          console.log('[DIAG] cookie names:', all.map(c => c.name).join(','))
          const authCookie = all.find(c => c.name.includes('auth-token'))
          if (authCookie) {
            console.log('[DIAG] auth cookie first40:', authCookie.value.slice(0, 40))
            console.log('[DIAG] auth cookie length:', authCookie.value.length)
          } else {
            console.log('[DIAG] no auth-token cookie found')
          }
          return all
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - cookies readonly
          }
        },
      },
    }
  )
}
