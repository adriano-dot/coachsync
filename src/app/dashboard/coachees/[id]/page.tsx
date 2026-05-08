'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatDateShort, getInitials, taskStatusColor, taskStatusLabel, wheelOfLifeLabels } from '@/lib/utils'
import { ArrowLeft, User, Mail, Phone, Target, CalendarDays, CheckSquare, Plus } from 'lucide-react'
import Link from 'next/link'

export default function CoacheeDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [coachee, setCoachee] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [{ data: coacheeData }, { data: sessionsData }, { data: tasksData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', params.id).single(),
        supabase.from('sessions').select('*').eq('coachee_id', params.id).order('session_date', { ascending: false }),
        supabase.from('tasks').select('*').eq('coachee_id', params.id).order('created_at', { ascending: false }),
      ])
      setCoachee(coacheeData)
      setSessions(sessionsData ?? [])
      setTasks(tasksData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-4 bg-cream-100 rounded w-24" />
        <div className="h-32 bg-cream-100 rounded-2xl" />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 h-64 bg-cream-100 rounded-2xl" />
          <div className="col-span-2 h-64 bg-cream-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!coachee) return <div className="p-8">Coachee não encontrado</div>

  const wheelLabels = wheelOfLifeLabels()
  const wheel = coachee.wheel_of_life as Record<string, number> | null
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length

  return (
    <div className="p-8 animate-in">
      <Link href="/dashboard/coachees" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar para coachees
      </Link>

      <div className="card mb-6 flex items-start gap-6">
        <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-sage-700 text-xl font-semibold font-display">{getInitials(coachee.full_name)}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-charcoal-800">{coachee.full_name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-sm text-charcoal-400"><Mail className="w-3.5 h-3.5" /> {coachee.email}</span>
                {coachee.phone && <span className="flex items-center gap-1.5 text-sm text-charcoal-400"><Phone className="w-3.5 h-3.5" /> {coachee.phone}</span>}
              </div>
              <p className="text-xs text-charcoal-400 mt-1">Cliente desde {formatDate(coachee.created_at)}</p>
            </div>
            <span className={`badge ${coachee.onboarding_step === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-amber-100 text-amber-700'}`}>
              {coachee.onboarding_step === 'completed' ? 'Processo ativo' : 'Em onboarding'}
            </span>
          </div>
          {coachee.objectives && (
            <div className="mt-4 p-3 bg-cream-50 rounded-xl">
              <p className="text-xs font-medium text-charcoal-500 mb-1 flex items-center gap-1.5"><Target className="w-3 h-3" /> Objetivos</p>
              <p className="text-sm text-charcoal-700">{coachee.objectives}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-charcoal-800 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sage-500" /> Sessões ({sessions.length})
              </h2>
              <Link href={`/dashboard/sessions/new?coachee=${params.id}`} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Nova
              </Link>
            </div>
            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map(session => (
                  <Link key={session.id} href={`/dashboard/sessions/${session.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status === 'completed' ? 'bg-sage-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-800 truncate">{session.title}</p>
                      <p className="text-xs text-charcoal-400">{formatDateShort(session.session_date)}</p>
                    </div>
                    {session.ai_summary && <span className="text-xs text-violet-500">✨ Resumo</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-400 text-center py-4">Nenhuma sessão ainda</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-charcoal-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" /> Tarefas
              </h2>
              <span className="text-xs text-charcoal-400">{completedTasks}/{totalTasks} concluídas</span>
            </div>
            {totalTasks > 0 && (
              <div className="w-full h-1.5 bg-cream-200 rounded-full mb-4">
                <div className="h-1.5 bg-sage-500 rounded-full transition-all" style={{ width: `${(completedTasks / totalTasks) * 100}%` }} />
              </div>
            )}
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 6).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-sage-400' : task.status === 'in_progress' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                    <p className={`flex-1 text-sm ${task.status === 'done' ? 'text-charcoal-400 line-through' : 'text-charcoal-700'}`}>{task.title}</p>
                    <span className={`badge text-xs ${taskStatusColor(task.status)}`}>{taskStatusLabel(task.status)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-400 text-center py-4">Nenhuma tarefa ainda</p>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          {wheel && (
            <div className="card">
              <h2 className="font-display text-base font-semibold text-charcoal-800 mb-4">Roda da Vida</h2>
              <div className="space-y-2.5">
                {Object.entries(wheelLabels).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-charcoal-600">{label}</span>
                      <span className="text-xs font-semibold text-charcoal-800">{wheel[key] ?? 0}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-cream-200 rounded-full">
                      <div className="h-1.5 bg-sage-400 rounded-full" style={{ width: `${((wheel[key] ?? 0) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <h2 className="font-display text-base font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados pessoais
            </h2>
            <div className="space-y-2 text-sm">
              {[{ label: 'CPF', value: coachee.cpf }, { label: 'Telefone', value: coachee.phone }, { label: 'Bio', value: coachee.bio }]
                .filter(f => f.value).map(field => (
                  <div key={field.label}>
                    <span className="text-xs text-charcoal-400">{field.label}</span>
                    <p className="text-charcoal-700">{field.value}</p>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
