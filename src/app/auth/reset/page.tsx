'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Leaf, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center"><p className="text-charcoal-400">Carregando...</p></div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}

function ResetPasswordInner() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast.error('Link inválido ou expirado. Solicite um novo.')
          router.push('/auth/forgot')
        } else {
          setReady(true)
        }
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true)
        } else {
          toast.error('Link inválido ou expirado.')
          router.push('/auth/forgot')
        }
      })
    }
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('As senhas não coincidem'); return }
    if (password.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error('Erro ao redefinir senha.'); setLoading(false); return }
    toast.success('Senha redefinida com sucesso!')
    router.push('/auth/login')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-charcoal-500 text-sm">Verificando link...</p>
        </div>
      </div>
    )
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">Nova senha</h1>
          <p className="text-charcoal-500 text-sm">Escolha uma senha segura para sua conta.</p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="label">Nova senha</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-10" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirmar senha</label>
            <input type={showPassword ? 'text' : 'password'} className="input" placeholder="Repita a senha" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={6} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
