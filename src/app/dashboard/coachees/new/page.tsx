'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCoaciheePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    objectives: '',
    bio: '',
    temporary_password: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Get current coach
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create auth user for coachee
    const password = form.temporary_password || Math.random().toString(36).slice(-8)

    const response = await fetch('/api/coachees/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        coach_id: user.id,
        password,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      toast.error(result.error || 'Erro ao cadastrar coachee')
      setLoading(false)
      return
    }

    toast.success('Coachee cadastrado com sucesso!')
    router.push(`/dashboard/coachees/${result.id}`)
  }

  return (
    <div className="p-8 max-w-2xl animate-in">
      <Link href="/dashboard/coachees" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Voltar para coachees
      </Link>

      <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">Novo coachee</h1>
      <p className="text-charcoal-500 text-sm mb-8">Preencha os dados do seu cliente</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 mb-2">Dados pessoais</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome completo *</label>
              <input type="text" className="input" value={form.full_name}
                onChange={e => update('full_name', e.target.value)} required />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input type="email" className="input" value={form.email}
                onChange={e => update('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input type="tel" className="input" placeholder="(11) 99999-9999" value={form.phone}
                onChange={e => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">CPF</label>
              <input type="text" className="input" placeholder="000.000.000-00" value={form.cpf}
                onChange={e => update('cpf', e.target.value)} />
            </div>
            <div>
              <label className="label">Senha temporária</label>
              <input type="text" className="input" placeholder="Gerada automaticamente" value={form.temporary_password}
                onChange={e => update('temporary_password', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 mb-2">Sobre o processo</h2>

          <div>
            <label className="label">Objetivos do coaching</label>
            <textarea className="input min-h-24 resize-none" placeholder="O que o coachee quer alcançar com o processo..."
              value={form.objectives} onChange={e => update('objectives', e.target.value)} />
          </div>

          <div>
            <label className="label">Notas iniciais</label>
            <textarea className="input min-h-20 resize-none" placeholder="Contexto, histórico, observações..."
              value={form.bio} onChange={e => update('bio', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/coachees" className="btn-secondary flex-1 text-center">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Cadastrando...' : 'Cadastrar coachee'}
          </button>
        </div>
      </form>
    </div>
  )
}
