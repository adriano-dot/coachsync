import { createClient } from '@/lib/supabase/server'
import { formatDateShort, getInitials } from '@/lib/utils'
import { Plus, Sparkles, CalendarDays } from 'lucide-react'
import Link from 'next/link'

export default async function SessionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, coachee:coachee_id(full_name)')
    .eq('coach_id', user.id)
    .order('session_date', { ascending: false })

  const completed = sessions?.filter(s => s.status === 'completed') ?? []
  const scheduled = sessions?.filter(s => s.status === 'scheduled') ?? []

  return (
    <div className="p-8 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">Sessões</h1>
          <p className="text-charcoal-500 text-sm mt-1">
            {completed.length} realizadas · {scheduled.length} agendadas
          </p>
        </div>
        <Link href="/dashboard/sessions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Sessão
        </Link>
      </div>

      {scheduled.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 mb-3">Agendadas</h2>
          <div className="space-y-2">
            {scheduled.map(session => (
              <Link key={session.id} href={`/dashboard/sessions/${session.id}`}
                className="card-hover flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal-800 truncate">{session.title}</p>
                  <p className="text-xs text-charcoal-400">
                    {(session.coachee as any)?.full_name} · {formatDateShort(session.session_date)}
                    {session.duration_minutes && ` · ${session.duration_minutes}min`}
                  </p>
                </div>
                <span className="badge bg-blue-100 text-blue-700">Agendada</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal-700 mb-3">Realizadas</h2>
        {completed.length > 0 ? (
          <div className="space-y-2">
            {completed.map(session => (
              <Link key={session.id} href={`/dashboard/sessions/${session.id}`}
                className="card-hover flex items-center gap-4">
                <div className="w-10 h-10 bg-sage-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sage-700 font-semibold text-sm">
                    {getInitials((session.coachee as any)?.full_name ?? '?')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal-800 truncate">{session.title}</p>
                  <p className="text-xs text-charcoal-400">
                    {(session.coachee as any)?.full_name} · {formatDateShort(session.session_date)}
                    {session.duration_minutes && ` · ${session.duration_minutes}min`}
                  </p>
                </div>
                {session.ai_summary ? (
                  <span className="badge bg-violet-100 text-violet-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Resumo IA
                  </span>
                ) : (
                  <span className="badge bg-sage-100 text-sage-700">Concluída</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <CalendarDays className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="text-charcoal-500 text-sm">Nenhuma sessão realizada ainda</p>
            <Link href="/dashboard/sessions/new" className="btn-primary inline-flex mt-4 items-center gap-2 text-sm">
              <Plus className="w-3.5 h-3.5" /> Registrar primeira sessão
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
