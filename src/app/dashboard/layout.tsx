'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookOpen,
  Settings,
  LogOut,
  Leaf,
  FolderOpen,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/coachees', label: 'Coachees', icon: Users },
  { href: '/dashboard/sessions', label: 'Sessões', icon: CalendarDays },
  { href: '/dashboard/materials', label: 'Materiais', icon: FolderOpen },
  { href: '/dashboard/library', label: 'Biblioteca', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function isActive(item: typeof navItems[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen flex bg-cream-50">
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-white border-r border-cream-200 flex flex-col fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-cream-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-charcoal-800 font-semibold">CoachSync</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', isActive(item) && 'active')}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-cream-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-cream-50 transition-colors">
            <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sage-700 text-xs font-semibold">
                {profile ? getInitials(profile.full_name) : '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-charcoal-800 truncate">
                {profile?.full_name ?? 'Carregando...'}
              </p>
              <p className="text-xs text-charcoal-400">Coach</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-charcoal-400 hover:text-charcoal-600 transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
