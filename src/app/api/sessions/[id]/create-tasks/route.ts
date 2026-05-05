import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AISummary, GeneratedTask } from '@/types'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('ai_summary, coachee_id, coach_id')
    .eq('id', params.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }
  if (session.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const summary = session.ai_summary as AISummary | null
  if (!summary?.tasks?.length) {
    return NextResponse.json({ error: 'Nenhuma tarefa no resumo desta sessão' }, { status: 400 })
  }

  // Parse due dates
  function parseDueDate(suggestion?: string): string | null {
    if (!suggestion) return null
    const now = new Date()
    const lower = suggestion.toLowerCase()
    if (lower.includes('1 semana') || lower.includes('uma semana'))    { now.setDate(now.getDate() + 7); return now.toISOString().split('T')[0] }
    if (lower.includes('2 semanas') || lower.includes('duas semanas')) { now.setDate(now.getDate() + 14); return now.toISOString().split('T')[0] }
    if (lower.includes('próxima sessão'))                              { now.setDate(now.getDate() + 14); return now.toISOString().split('T')[0] }
    if (lower.includes('1 mês') || lower.includes('um mês'))          { now.setMonth(now.getMonth() + 1); return now.toISOString().split('T')[0] }
    return null
  }

  const rows = summary.tasks.map((task: GeneratedTask) => ({
    session_id:  params.id,
    coach_id:    session.coach_id,
    coachee_id:  session.coachee_id,
    title:       task.title,
    description: task.description ?? null,
    priority:    task.priority ?? 'medium',
    status:      'pending',
    due_date:    parseDueDate(task.due_date_suggestion),
  }))

  const { data: created, error: insertError } = await supabase
    .from('tasks')
    .insert(rows)
    .select()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, created: created?.length ?? 0, tasks: created })
}
