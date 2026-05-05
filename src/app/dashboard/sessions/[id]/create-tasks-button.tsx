'use client'

import { useState } from 'react'
import { CheckSquare, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function CreateTasksButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleCreate() {
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionId}/create-tasks`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Erro ao criar tarefas')
    } else {
      toast.success(`${data.created} tarefa(s) criada(s) com sucesso!`)
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <span className="text-xs text-sage-600 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> Tarefas criadas
      </span>
    )
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckSquare className="w-3 h-3" />}
      {loading ? 'Criando...' : 'Criar todas as tarefas'}
    </button>
  )
}
