'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Sparkles, Clock, User, CheckSquare, BookOpen, Target, Lightbulb, Pencil, FileText } from 'lucide-react'
import Link from 'next/link'
import type { AISummary } from '@/types'
import { CreateTasksButton } from './create-tasks-button'

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sessions')
        .select('*, coachee:coachee_id(full_name, email, objectives)')
        .eq('id', params.id)
        .single()
      setSession(data)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl animate-pulse space-y-4">
        <div className="h-4 bg-cream-100 rounded w-24" />
        <div className="h-10 bg-cream-100 rounded-xl w-96" />
        <div className="h-32 bg-cream-100 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-cream-100 rounded-2xl" />
          <div className="h-48 bg-cream-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!session) return <div className="p-8">Sessão não encontrada</div>

  const summary = session.ai_summary as AISummary | null
  const coachee = session.coachee as any

  return (
    <div className="p-8 max-w-4xl animate-in">
      <Link href="/dashboard/sessions" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Voltar para sessões
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">{session.title}</h1>
          <Link href={`/dashboard/sessions/${session.id}/edit`} className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-charcoal-700 mt-1">
            <Pencil className="w-3 h-3" /> Editar sessão
          </Link>
          <div className="flex items-center gap-4 text-sm text-charcoal-400">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {coachee?.full_name}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.duration_minutes} min</span>
            <span>{formatDate(session.session_date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/sessions/${session.id}/pdf`}
            className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-700 border border-cream-200 hover:border-charcoal-300 px-3 py-1.5 rounded-xl transition-colors">
            <FileText className="w-3.5 h-3.5" /> Exportar PDF
          </Link>
          <span className={`badge ${session.status === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-blue-100 text-blue-700'}`}>
            {session.status === 'completed' ? 'Concluída' : 'Agendada'}
          </span>
        </div>
      </div>

      {summary ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-violet-600 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> Análise gerada com IA
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-semibold text-charcoal-800 mb-3">Visão geral da sessão</h2>
            <p className="text-charcoal-600 text-sm leading-relaxed">{summary.overview}</p>
            <div className="mt-4 p-3 bg-cream-50 rounded-xl">
              <p className="text-xs font-medium text-charcoal-500 mb-1">Tom emocional</p>
              <p className="text-sm text-charcoal-700">{summary.emotional_tone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-display text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sage-500" /> Tópicos principais
              </h3>
              <ul className="space-y-1.5">
                {summary.main_topics.map((topic: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-charcoal-600">
                    <span className="w-1.5 h-1.5 bg-sage-400 rounded-full mt-1.5 flex-shrink-0" />{topic}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="font-display text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Percepções & avanços
              </h3>
              <ul className="space-y-1.5">
                {summary.breakthroughs.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-charcoal-600">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {summary.commitments.length > 0 && (
            <div className="card">
              <h3 className="font-display text-base font-semibold text-charcoal-800 mb-3">Compromissos assumidos</h3>
              <div className="space-y-2">
                {summary.commitments.map((c: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-sage-50 rounded-xl">
                    <CheckSquare className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-charcoal-700">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.tasks.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-charcoal-800">Tarefas geradas</h3>
                <CreateTasksButton sessionId={session.id} />
              </div>
              <div className="space-y-3">
                {summary.tasks.map((task: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    task.priority === 'high' ? 'border-red-200 bg-red-50' :
                    task.priority === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-cream-200 bg-cream-50'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-charcoal-800">{task.title}</p>
                      <span className={`badge text-xs ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-sage-100 text-sage-700'
                      }`}>{task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                    </div>
                    <p className="text-xs text-charcoal-500 mt-1">{task.description}</p>
                    {task.due_date_suggestion && <p className="text-xs text-charcoal-400 mt-1">📅 {task.due_date_suggestion}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.suggested_tools?.length > 0 && (
            <div className="card">
              <h3 className="font-display text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Ferramentas sugeridas para próxima sessão
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {summary.suggested_tools.map((tool: any, i: number) => (
                  <div key={i} className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <p className="text-sm font-medium text-violet-800">{tool.name}</p>
                    <p className="text-xs text-charcoal-500 mt-1">{tool.rationale}</p>
                    <span className="badge bg-violet-100 text-violet-600 mt-2">{tool.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card bg-charcoal-900 text-white">
            <h3 className="font-display text-base font-semibold mb-2">Foco para a próxima sessão</h3>
            <p className="text-charcoal-300 text-sm leading-relaxed">{summary.next_session_focus}</p>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Sparkles className="w-10 h-10 text-charcoal-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-charcoal-700 mb-2">Nenhuma análise gerada</h3>
          <p className="text-charcoal-400 text-sm mb-4">Adicione uma transcrição para gerar insights com IA</p>
          <Link href={`/dashboard/sessions/${session.id}/edit`} className="btn-primary inline-flex">Adicionar transcrição</Link>
        </div>
      )}

      {session.notes && (
        <div className="card mt-6">
          <h3 className="font-display text-base font-semibold text-charcoal-800 mb-2">Notas do coach</h3>
          <p className="text-charcoal-600 text-sm leading-relaxed whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
    </div>
  )
}
