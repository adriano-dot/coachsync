import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDateShort } from '@/lib/utils'
import { CalendarDays, Sparkles, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function CoacheeSessionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('coachee_id', user.id)
    .order('session_date', { ascending: false })

  return (
    <div className="p-8 animate-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Minhas sessões</h1>
        <p className="text-charcoal-500 text-sm mt-1">{sessions?.length ?? 0} sessões no total</p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map(session => (
            <Link
              key={session.id}
              href={`/coachee/sessions/${session.id}`}
              className="card-hover flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                session.status === 'completed' ? 'bg-sage-50' : 'bg-blue-50'
              }`}>
                <CalendarDays className={`w-5 h-5 ${session.status === 'completed' ? 'text-sage-500' : 'text-blue-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal-800 truncate">{session.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-charcoal-400">{formatDateShort(session.session_date)}</span>
                  {session.duration_minutes && (
                    <span className="flex items-center gap-1 text-xs text-charcoal-400">
                      <Clock className="w-3 h-3" /> {session.duration_minutes}min
                    </span>
                  )}
                </div>
              </div>
              {session.ai_summary ? (
                <span className="badge bg-violet-100 text-violet-700 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3" /> Insights disponíveis
                </span>
              ) : (
                <span className={`badge flex-shrink-0 ${
                  session.status === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {session.status === 'completed' ? 'Concluída' : 'Agendada'}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <CalendarDays className="w-10 h-10 text-charcoal-300 mx-auto mb-4" />
          <p className="font-display text-lg font-semibold text-charcoal-600 mb-2">Nenhuma sessão ainda</p>
          <p className="text-charcoal-400 text-sm">Suas sessões com o coach aparecerão aqui</p>
        </div>
      )}
    </div>
  )
}
