'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { taskStatusColor, taskStatusLabel, priorityColor, priorityLabel, formatDateShort } from '@/lib/utils'
import { CheckSquare, Clock, AlertCircle } from 'lucide-react'
import type { Task } from '@/types'
import toast from 'react-hot-toast'

const STATUS_ORDER = ['pending', 'in_progress', 'done'] as const

export default function CoacheeTasksPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'done'>('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('coachee_id', user.id)
        .order('created_at', { ascending: false })
      setTasks(data ?? [])
    }
    load()
  }, [])

  async function updateStatus(taskId: string, status: Task['status']) {
    const update: any = { status }
    if (status === 'done') update.completed_at = new Date().toISOString()

    const { error } = await supabase.from('tasks').update(update).eq('id', taskId)
    if (error) { toast.error('Erro ao atualizar'); return }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...update } : t))
    if (status === 'done') toast.success('Tarefa concluída! 🎉')
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="p-8 animate-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Minhas tarefas</h1>
        <p className="text-charcoal-500 text-sm mt-1">{counts.pending} pendentes · {counts.done} concluídas</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {([['all', 'Todas'], ['pending', 'Pendentes'], ['in_progress', 'Em andamento'], ['done', 'Concluídas']] as const).map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-charcoal-800 text-white'
                  : 'bg-white text-charcoal-500 hover:bg-cream-100 border border-cream-200'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">({counts[value]})</span>
            </button>
          )
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(task => (
            <div key={task.id} className={`card flex items-start gap-4 ${task.status === 'done' ? 'opacity-70' : ''}`}>
              {/* Status button */}
              <button
                onClick={() => {
                  const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length]
                  updateStatus(task.id, next)
                }}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  task.status === 'done'
                    ? 'bg-sage-500 border-sage-500'
                    : task.status === 'in_progress'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-charcoal-300 hover:border-sage-400'
                }`}
              >
                {task.status === 'done' && <CheckSquare className="w-3 h-3 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${task.status === 'done' ? 'text-charcoal-400 line-through' : 'text-charcoal-800'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium ${priorityColor(task.priority)}`}>
                      {priorityLabel(task.priority)}
                    </span>
                    <span className={`badge text-xs ${taskStatusColor(task.status)}`}>
                      {taskStatusLabel(task.status)}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">{task.description}</p>
                )}

                <div className="flex items-center gap-4 mt-2">
                  {task.due_date && (
                    <span className={`flex items-center gap-1 text-xs ${
                      new Date(task.due_date) < new Date() && task.status !== 'done'
                        ? 'text-red-500'
                        : 'text-charcoal-400'
                    }`}>
                      {new Date(task.due_date) < new Date() && task.status !== 'done'
                        ? <AlertCircle className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />
                      }
                      {formatDateShort(task.due_date)}
                    </span>
                  )}

                  {task.status !== 'done' && (
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(task.id, 'in_progress')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Iniciar
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(task.id, 'done')}
                        className="text-xs text-sage-600 hover:text-sage-700 font-medium"
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <CheckSquare className="w-10 h-10 text-charcoal-300 mx-auto mb-4" />
          <p className="text-charcoal-500">Nenhuma tarefa nesta categoria</p>
        </div>
      )}
    </div>
  )
}
