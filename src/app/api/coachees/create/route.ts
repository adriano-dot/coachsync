import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client with service role key — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, password, phone, cpf, objectives, bio, coach_id } = body

    // Create auth user for coachee
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'coachee',
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update profile with coachee details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone,
        cpf,
        objectives,
        bio,
        coach_id,
        onboarding_step: 'profile',
      })
      .eq('id', authData.user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Send welcome email (optional — add Resend integration)
    // await sendWelcomeEmail({ email, full_name, password })

    return NextResponse.json({ id: authData.user.id, success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
