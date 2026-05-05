'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Save, User, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
      bio: profile.bio,
      company: profile.company,
      methodology_notes: profile.methodology_notes,
    }).eq('id', user.id)

    if (error) { toast.error('Erro ao salvar'); setLoading(false); return }
    toast.success('Configurações salvas!')
    setLoading(false)
  }

  if (!profile) return <div className="p-8 text-charcoal-400">Carregando...</div>

  return (
    <div className="p-8 max-w-2xl animate-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Configurações</h1>
        <p className="text-charcoal-500 text-sm mt-1">Gerencie seu perfil e preferências</p>
      </div>

      <form onSubmit={saveProfile} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Perfil do Coach
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome completo</label>
              <input type="text" className="input" value={profile.full_name ?? ''}
                onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Empresa / Marca</label>
              <input type="text" className="input" value={profile.company ?? ''}
                onChange={e => setProfile((p: any) => ({ ...p, company: e.target.value }))}
                placeholder="Seu estúdio ou empresa" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input type="tel" className="input" value={profile.phone ?? ''}
                onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Bio profissional</label>
              <textarea className="input resize-none min-h-20" value={profile.bio ?? ''}
                onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                placeholder="Sua especialidade, certificações, abordagem..." />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Metodologia
          </h2>
          <p className="text-xs text-charcoal-500">
            Estas notas são usadas pela IA para personalizar sugestões de sessão
          </p>
          <div>
            <label className="label">Notas de metodologia</label>
            <textarea className="input resize-none min-h-32" value={profile.methodology_notes ?? ''}
              onChange={e => setProfile((p: any) => ({ ...p, methodology_notes: e.target.value }))}
              placeholder="Descreva sua abordagem, ferramentas preferidas, estilo de condução de sessão..." />
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4" /> Notificações
          </h2>
          <p className="text-xs text-charcoal-400 mb-4">
            Integração com WhatsApp e Telegram disponível em breve (V2)
          </p>
          <div className="space-y-3">
            {['Resumo semanal por e-mail', 'Alerta de tarefas vencidas'].map(label => (
              <label key={label} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-sage-500" />
                <span className="text-sm text-charcoal-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 w-full justify-center">
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
