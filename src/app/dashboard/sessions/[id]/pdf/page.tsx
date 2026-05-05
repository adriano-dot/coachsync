import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { AISummary } from '@/types'
import { PrintButton } from './print-button'

export default async function SessionPdfPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*, coachee:coachee_id(full_name, email, objectives), coach:coach_id(full_name, company)')
    .eq('id', params.id)
    .single()

  if (!session) return <div className="p-8">Sessão não encontrada</div>

  const summary = session.ai_summary as AISummary | null
  const coachee = session.coachee as any
  const coach   = session.coach as any

  return (
    <>
      {/* Print controls — hidden on print */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-cream-200 px-6 py-3 flex items-center justify-between">
        <a href={`/dashboard/sessions/${params.id}`} className="text-sm text-charcoal-500 hover:text-charcoal-700">
          ← Voltar para a sessão
        </a>
        <PrintButton />
      </div>

      {/* Report */}
      <div className="pt-14 print:pt-0 bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-charcoal-900">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-sage-500 rounded-md flex items-center justify-center print:bg-sage-500">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <span className="font-display font-bold text-charcoal-800">CoachSync</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-charcoal-900 mb-1">Relatório de Sessão</h1>
              <p className="text-charcoal-500 text-sm">{session.title}</p>
            </div>
            <div className="text-right text-sm text-charcoal-500">
              <p className="font-medium text-charcoal-800">{coach?.company || coach?.full_name}</p>
              <p>{coach?.full_name}</p>
              <p className="mt-1">{formatDate(session.session_date)}</p>
              {session.duration_minutes && <p>{session.duration_minutes} minutos</p>}
            </div>
          </div>

          {/* Coachee info */}
          <div className="grid grid-cols-2 gap-6 mb-8 p-5 bg-cream-50 rounded-xl print:border print:border-cream-200">
            <div>
              <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-widest mb-1">Coachee</p>
              <p className="font-semibold text-charcoal-800">{coachee?.full_name}</p>
              <p className="text-sm text-charcoal-500">{coachee?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm text-charcoal-700">
                {session.status === 'completed' ? '✅ Concluída' : '📅 Agendada'}
              </p>
            </div>
            {coachee?.objectives && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-widest mb-1">Objetivos do processo</p>
                <p className="text-sm text-charcoal-700 leading-relaxed">{coachee.objectives}</p>
              </div>
            )}
          </div>

          {summary ? (
            <div className="space-y-8">
              {/* Overview */}
              <section>
                <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                  1. Visão geral da sessão
                </h2>
                <p className="text-sm text-charcoal-700 leading-relaxed">{summary.overview}</p>
                {summary.emotional_tone && (
                  <div className="mt-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                    <span className="text-xs font-semibold text-violet-600">Tom emocional: </span>
                    <span className="text-sm text-charcoal-700">{summary.emotional_tone}</span>
                  </div>
                )}
              </section>

              {/* Topics */}
              {summary.main_topics?.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                    2. Tópicos principais
                  </h2>
                  <ul className="space-y-1.5">
                    {summary.main_topics.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700">
                        <span className="text-sage-500 font-bold flex-shrink-0">{i + 1}.</span>{t}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Breakthroughs */}
              {summary.breakthroughs?.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                    3. Insights e avanços
                  </h2>
                  <ul className="space-y-2">
                    {summary.breakthroughs.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700 p-3 bg-amber-50 rounded-lg">
                        <span className="flex-shrink-0">💡</span>{b}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Commitments */}
              {summary.commitments?.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                    4. Compromissos assumidos
                  </h2>
                  <ul className="space-y-2">
                    {summary.commitments.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700 p-3 bg-sage-50 rounded-lg border border-sage-100">
                        <span className="flex-shrink-0 text-sage-500">✓</span>{c}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tasks */}
              {summary.tasks?.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                    5. Plano de ação
                  </h2>
                  <div className="space-y-3">
                    {summary.tasks.map((task, i) => (
                      <div key={i} className="p-4 border border-cream-200 rounded-xl">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-charcoal-800">{task.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            task.priority === 'high'   ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-sage-100 text-sage-700'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        {task.description && <p className="text-xs text-charcoal-500 mb-1">{task.description}</p>}
                        {task.due_date_suggestion && (
                          <p className="text-xs text-charcoal-400">📅 {task.due_date_suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Next session */}
              {summary.next_session_focus && (
                <section>
                  <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                    6. Foco para a próxima sessão
                  </h2>
                  <div className="p-4 bg-charcoal-900 rounded-xl text-white print:border print:border-charcoal-800">
                    <p className="text-sm leading-relaxed">{summary.next_session_focus}</p>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-charcoal-400">
              <p>Nenhuma análise IA disponível para esta sessão.</p>
            </div>
          )}

          {/* Coach notes */}
          {session.notes && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold text-charcoal-900 mb-3 pb-1 border-b border-cream-200">
                Notas do coach
              </h2>
              <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{session.notes}</p>
            </section>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-cream-200 flex items-center justify-between text-xs text-charcoal-300">
            <span>CoachSync — Relatório gerado automaticamente com IA</span>
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </>
  )
}
