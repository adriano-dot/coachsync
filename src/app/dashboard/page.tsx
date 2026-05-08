'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateShort } from '@/lib/utils'
import { Users, CalendarDays, CheckSquare, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    profile: any
    coacheesCount: number
    sessions: any[]
    tasks: any[]
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: profile },
        { count: coacheesCount },
        { data: sessions },
        { data: tasks },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('coach_id', user.id).eq('role', 'coachee'),
        supabase.from('sessions')
          .select('*, coachee:coachee_id(full_name, avatar_url)')
          .eq('coach_id', user.id)
          .order('session_date', { ascending: false })
          .limit(5),
        supabase.from('tasks')
          .select('*')
          .eq('coach_id', user.id)
          .neq('status', 'done'),
      ])

      setData({ profile, coacheesCount: coacheesCount ?? 0, sessions: sessions ?? [], tasks: tasks ?? [] })
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cream-100 rounded-xl w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-cream-100 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 h-64 bg-cream-100 rounded-2xl" />
            <div className="col-span-2 space-y-4">
              <div className="h-32 bg-cream-100 rounded-2xl" />
              <div className="h-32 bg-cream-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { profile, coacheesCount, sessions, tasks } = data
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Coach'
  const pendingTasks = tasks?.length ?? 0
  const completedSessions = sessions?.filter((s: any) => s.status === 'completed').length ?? 0
  const upcomingSessions = sessions?.filter((s: any) => s.status === 'scheduled') ?? []

  const stats = [
    { label: 'Coachees ativos', value: coacheesCount, icon: Users, color: 'text-sage-600 bg-sage-50' },
    { label: 'Sessões realizadas', value: completedSessions, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Tarefas pendentes', value: pendingTasks, icon: CheckSquare, color: 'text-amber-600 bg-amber-50' },
    { label: 'Taxa de evolução', value: '87%', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
  ]

  return (
    <div className="p-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-charcoal-400 text-sm mb-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">
            Olá, {firstName} 👋
          </h1>
          <p className="text-charcoal-500 text-sm mt-1">
            Aqui está o resumo de hoje
          </p>
        </div>

        <Link href="/dashboard/sessions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Sessão
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`card slide-up stagger-${i + 1}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-charcoal-500 text-xs font-medium mb-2">{stat.label}</p>
                <p className="font-display text-3xl font-bold text-charcoal-800">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-6">
        {/* Recent sessions */}
        <div className="col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-charcoal-800">Sessões recentes</h2>
            <Link href="/dashboard/sessions" className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session: any) => (
                <Link
                  key={session.id}
                  href={`/dashboard/sessions/${session.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-cream-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sage-700 text-xs font-semibold">
                      {session.coachee?.full_name?.charAt(0) ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-800 truncate">{session.title}</p>
                    <p className="text-xs text-charcoal-400">
                      {session.coachee?.full_name} · {formatDateShort(session.session_date)}
                    </p>
                  </div>
                  <span className={`badge text-xs ${
                    session.status === 'completed' ? 'bg-sage-100 text-sage-700' :
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {session.status === 'completed' ? 'Concluída' :
                     session.status === 'scheduled' ? 'Agendada' : 'Cancelada'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-charcoal-400 text-sm">Nenhuma sessão ainda</p>
              <Link href="/dashboard/sessions/new" className="btn-primary inline-flex mt-3 items-center gap-2 text-xs">
                <Plus className="w-3 h-3" /> Criar primeira sessão
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming sessions + tasks */}
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-charcoal-800">Próximas sessões</h2>
            </div>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.slice(0, 3).map((session: any) => (
                  <div key={session.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-cream-50">
                    <div className="w-2 h-2 bg-sage-400 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal-700 truncate">{session.title}</p>
                      <p className="text-xs text-charcoal-400">{formatDateShort(session.session_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-400 py-2">Nenhuma sessão agendada</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-charcoal-800">Tarefas pendentes</h2>
              <span className="badge bg-amber-100 text-amber-700">{pendingTasks}</span>
            </div>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 4).map((task: any) => (
                  <div key={task.id} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-cream-50">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-amber-400' : 'bg-sage-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal-700 truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-charcoal-400">Até {formatDateShort(task.due_date)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-400 py-2">Tudo em dia! 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
