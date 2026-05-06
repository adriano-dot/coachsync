'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Leaf, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) {
      toast.error('Erro ao enviar email. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-in">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-charcoal-800 text-lg font-semibold">CoachSync</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-sage-600" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-charcoal-800">Email enviado!</h1>
            <p className="text-charcoal-500 text-sm leading-relaxed">
              Enviamos um link de redefinição para <strong className="text-charcoal-700">{email}</strong>. Verifique sua caixa de entrada e spam.
            </p>
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-sage-600 hover:text-sage-700 font-medium mt-4">
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">Esqueci minha senha</h1>
              <p className="text-charcoal-500 text-sm">Digite seu email e enviaremos um link para redefinir sua senha.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-700">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
