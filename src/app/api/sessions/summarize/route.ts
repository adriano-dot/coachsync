import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { SESSION_SUMMARY_PROMPT } from '@/lib/prompts'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { session_id, transcript, coachee_id } = await req.json()

    if (!transcript || transcript.length < 100) {
      return NextResponse.json({ error: 'Transcrição muito curta' }, { status: 400 })
    }

    // Get coachee name and previous sessions context
    const { data: coachee } = await supabaseAdmin
      .from('profiles')
      .select('full_name, objectives')
      .eq('id', coachee_id)
      .single()

    const { data: prevSessions } = await supabaseAdmin
      .from('sessions')
      .select('ai_summary, session_date')
      .eq('coachee_id', coachee_id)
      .eq('status', 'completed')
      .not('ai_summary', 'is', null)
      .order('session_date', { ascending: false })
      .limit(3)

    const previousContext = prevSessions
      ?.map(s => `Sessão ${s.session_date}: ${(s.ai_summary as any)?.overview ?? ''}`)
      .join('\n\n')

    // Generate summary with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: SESSION_SUMMARY_PROMPT(
            transcript,
            coachee?.full_name ?? 'Coachee',
            previousContext
          ),
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Resposta inesperada da IA' }, { status: 500 })
    }

    // Parse JSON response
    const cleanText = content.text.replace(/```json\n?|```/g, '').trim()
    const summary = JSON.parse(cleanText)

    // Save summary to session
    await supabaseAdmin
      .from('sessions')
      .update({ ai_summary: summary })
      .eq('id', session_id)

    // Auto-create tasks from summary
    if (summary.tasks?.length > 0) {
      const { data: session } = await supabaseAdmin
        .from('sessions')
        .select('coach_id')
        .eq('id', session_id)
        .single()

      const tasks = summary.tasks.map((task: any) => ({
        session_id,
        coach_id: session?.coach_id,
        coachee_id,
        title: task.title,
        description: task.description,
        priority: task.priority ?? 'medium',
        status: 'pending',
      }))

      await supabaseAdmin.from('tasks').insert(tasks)
    }

    return NextResponse.json({ summary, success: true })
  } catch (err: any) {
    console.error('Summarize error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
