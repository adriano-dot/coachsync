'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Leaf } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'coachee' as 'coach' | 'coachee',
  })
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: form.full_name,
          role: form.role,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Conta criada! Verifique seu email.')
    router.push('/auth/login')
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
          <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">
            Criar conta
          </h1>
          <p className="text-charcoal-500 text-sm">
            Comece sua jornada de transformação
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label">Tipo de conta</label>
            <div className="grid grid-cols-2 gap-2">
              {(['coach', 'coachee'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => update('role', role)}
                  className={`py-3 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                    form.role === role
                      ? 'border-sage-500 bg-sage-50 text-sage-700'
                      : 'border-cream-300 bg-white text-charcoal-500 hover:border-cream-400'
                  }`}
                >
                  {role === 'coach' ? '🎯 Coach' : '🌱 Coachee'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Nome completo</label>
            <input
              type="text"
              className="input"
              placeholder="Seu nome"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-500">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-sage-600 font-medium hover:text-sage-700">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
