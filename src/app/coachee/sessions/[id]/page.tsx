import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Sparkles, CheckSquare, Target } from 'lucide-react'
import Link from 'next/link'
import type { AISummary } from '@/types'

export default async function CoacheeSessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!session) return <div className="p-8">Sessão não encontrada</div>

  const summary = session.ai_summary as AISummary | null

  return (
    <div className="p-8 max-w-3xl animate-in">
      <Link href="/coachee/sessions" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar para sessões
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-charcoal-800 mb-1">{session.title}</h1>
        <p className="text-charcoal-400 text-sm">{formatDate(session.session_date)}</p>
      </div>

      {summary ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-violet-600 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" /> Resumo gerado com IA
          </div>

          <div className="card">
            <h2 className="font-display text-base font-semibold text-charcoal-800 mb-2">O que aconteceu nesta sessão</h2>
            <p className="text-sm text-charcoal-600 leading-relaxed">{summary.overview}</p>
          </div>

          {summary.commitments.length > 0 && (
            <div className="card">
              <h2 className="font-display text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sage-500" /> Meus compromissos
              </h2>
              <ul className="space-y-2">
                {summary.commitments.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700">
                    <span className="w-1.5 h-1.5 bg-sage-400 rounded-full mt-1.5 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.next_steps.length > 0 && (
            <div className="card">
              <h2 className="font-display text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" /> Próximos passos
              </h2>
              <ul className="space-y-2">
                {summary.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700">
                    <span className="text-amber-500 font-semibold text-xs mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.breakthroughs.length > 0 && (
            <div className="card bg-sage-50 border-sage-200">
              <h2 className="font-display text-base font-semibold text-sage-800 mb-3">✨ Seus avanços desta sessão</h2>
              <ul className="space-y-1.5">
                {summary.breakthroughs.map((b, i) => (
                  <li key={i} className="text-sm text-sage-700">{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Sparkles className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
          <p className="text-charcoal-500 text-sm">Análise ainda não disponível para esta sessão</p>
        </div>
      )}
    </div>
  )
}
