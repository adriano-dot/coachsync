import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { coach_id, coachee_id, title, meet_url } = await req.json()

    // Create session record
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        coach_id,
        coachee_id,
        title: title ?? `Sessão ao vivo — ${new Date().toLocaleDateString('pt-BR')}`,
        session_date: new Date().toISOString(),
        status: 'scheduled',
        notes: meet_url ? `Google Meet: ${meet_url}` : null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Build the live session URL
    const { data: coachee } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', coachee_id)
      .single()

    const params = new URLSearchParams({
      session_id: session.id,
      coachee_id,
      coachee_name: coachee?.full_name ?? 'Coachee',
      ...(meet_url ? { meet_url } : {}),
    })

    return NextResponse.json({
      session_id: session.id,
      live_url: `/dashboard/sessions/live?${params.toString()}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
