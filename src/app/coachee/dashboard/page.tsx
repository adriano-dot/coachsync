import { createClient } from '@/lib/supabase/server'
import { formatDateShort, taskStatusColor, taskStatusLabel } from '@/lib/utils'
import { CheckSquare, CalendarDays, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function CoaciheeDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: sessions },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('profiles').select('*, coach:coach_id(full_name)').eq('id', user.id).single(),
    supabase.from('sessions')
      .select('*')
      .eq('coachee_id', user.id)
      .order('session_date', { ascending: false })
      .limit(3),
    supabase.from('tasks')
      .select('*')
      .eq('coachee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'
  const coachName = (profile?.coach as any)?.full_name ?? 'seu coach'
  const pendingTasks = tasks?.filter(t => t.status !== 'done').length ?? 0
  const doneTasks = tasks?.filter(t => t.status === 'done').length ?? 0
  const total = tasks?.length ?? 0
  const completionRate = total > 0 ? Math.round((doneTasks / total) * 100) : 0

  return (
    <div className="p-8 animate-in">
      <div className="mb-8">
        <p className="text-charcoal-400 text-sm mb-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">
          Olá, {firstName} 🌱
        </h1>
        <p className="text-charcoal-500 text-sm mt-1">
          Acompanhando seu processo com {coachName}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Sessões realizadas', value: sessions?.filter(s => s.status === 'completed').length ?? 0, icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
          { label: 'Tarefas pendentes', value: pendingTasks, icon: CheckSquare, color: 'bg-amber-50 text-amber-600' },
          { label: 'Taxa de conclusão', value: `${completionRate}%`, icon: TrendingUp, color: 'bg-sage-50 text-sage-600' },
        ].map((stat, i) => (
          <div key={stat.label} className={`card slide-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-charcoal-500 mb-1">{stat.label}</p>
                <p className="font-display text-2xl font-bold text-charcoal-800">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Tasks */}
        <div className="col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-charcoal-800">Minhas tarefas</h2>
            <Link href="/coachee/tasks" className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'done' ? 'bg-sage-400' :
                    task.status === 'in_progress' ? 'bg-blue-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'text-charcoal-400 line-through' : 'text-charcoal-800'}`}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-charcoal-400">Até {formatDateShort(task.due_date)}</p>
                    )}
                  </div>
                  <span className={`badge text-xs ${taskStatusColor(task.status)}`}>
                    {taskStatusLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal-400 text-sm text-center py-8">Nenhuma tarefa ainda 🎉</p>
          )}
        </div>

        {/* Right: sessions + chat CTA */}
        <div className="col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-display text-base font-semibold text-charcoal-800 mb-4">Últimas sessões</h2>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map(session => (
                  <Link key={session.id} href={`/coachee/sessions/${session.id}`}
                    className="block p-3 rounded-xl hover:bg-cream-50 transition-colors">
                    <p className="text-sm font-medium text-charcoal-700 truncate">{session.title}</p>
                    <p className="text-xs text-charcoal-400">{formatDateShort(session.session_date)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-400">Nenhuma sessão ainda</p>
            )}
          </div>

          {/* AI chat CTA */}
          <Link href="/coachee/chat" className="card block hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-200 bg-charcoal-900 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-violet-500/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-violet-400" />
              </div>
              <p className="font-display text-base font-semibold">IA Assistente</p>
            </div>
            <p className="text-charcoal-400 text-xs leading-relaxed">
              Converse com sua IA pessoal, tire dúvidas e se mantenha focado entre sessões.
            </p>
            <div className="flex items-center gap-1 mt-3 text-violet-400 text-xs font-medium">
              Conversar agora <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
