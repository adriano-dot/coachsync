'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Leaf } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed') || error.code === 'email_not_confirmed') {
        toast.error('Confirme seu email antes de entrar. Verifique sua caixa de entrada.')
      } else {
        toast.error('Email ou senha incorretos')
      }
      setLoading(false)
      return
    }

    // Get profile to determine redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_step')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'coach') {
      router.push('/dashboard')
    } else {
      const step = profile?.onboarding_step
      if (step && step !== 'completed') {
        router.push(`/coachee/onboarding/${step}`)
      } else {
        router.push('/coachee/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-charcoal-900 p-12 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, #5a8560 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, #c4a06a 0%, transparent 40%)`
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sage-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-white text-xl font-semibold tracking-tight">
              CoachSync
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="font-display text-4xl font-semibold text-white leading-snug">
            Transforme sessões em<br />
            <span className="text-sage-400">resultados reais.</span>
          </p>
          <p className="text-charcoal-400 text-base leading-relaxed max-w-sm">
            Plataforma completa para coaches gerenciarem sessões, acompanharem evolução e potencializarem resultados com IA.
          </p>

          <div className="flex gap-8 pt-4">
            {[
              { value: '3x', label: 'mais engajamento' },
              { value: '80%', label: 'conclusão de tarefas' },
              { value: '2min', label: 'para resumir sessão' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-display text-2xl text-white font-bold">{stat.value}</div>
                <div className="text-charcoal-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-charcoal-600 text-xs">
          © 2024 CoachSync. Todos os direitos reservados.
        </p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-charcoal-800 text-lg font-semibold">CoachSync</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-charcoal-500 text-sm">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Senha</label>
                <Link href="/auth/forgot" className="text-xs text-sage-600 hover:text-sage-700">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-charcoal-500">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-sage-600 font-medium hover:text-sage-700">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
