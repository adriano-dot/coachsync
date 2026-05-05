import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { COACHEE_AI_SYSTEM_PROMPT } from '@/lib/prompts'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { message, coachee_id, history } = await req.json()

    // Get coachee profile
    const { data: coachee } = await supabaseAdmin
      .from('profiles')
      .select('*, coach:coach_id(full_name)')
      .eq('id', coachee_id)
      .single()

    // Get session summaries
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('ai_summary, session_date, title')
      .eq('coachee_id', coachee_id)
      .eq('status', 'completed')
      .not('ai_summary', 'is', null)
      .order('session_date', { ascending: false })
      .limit(5)

    // Get pending tasks
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('title, status, due_date, priority')
      .eq('coachee_id', coachee_id)
      .neq('status', 'done')
      .limit(10)

    const sessionHistory = sessions
      ?.map(s => `${s.title} (${s.session_date}): ${(s.ai_summary as any)?.overview ?? ''}`)
      .join('\n') ?? 'Nenhuma sessão registrada ainda'

    const taskList = tasks
      ?.map(t => `- ${t.title} [${t.status}]${t.due_date ? ` (vence ${t.due_date})` : ''}`)
      .join('\n') ?? 'Nenhuma tarefa pendente'

    const systemPrompt = COACHEE_AI_SYSTEM_PROMPT(
      coachee?.full_name ?? 'você',
      (coachee?.coach as any)?.full_name ?? 'seu coach',
      sessionHistory,
      taskList,
      coachee?.objectives ?? 'Objetivos não definidos'
    )

    // Build conversation history
    const messages = [
      ...(history ?? []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save messages to DB
    await supabaseAdmin.from('chat_messages').insert([
      { coachee_id, role: 'user', content: message },
      { coachee_id, role: 'assistant', content: reply },
    ])

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
