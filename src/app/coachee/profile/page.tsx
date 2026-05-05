'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInitials, wheelOfLifeLabels } from '@/lib/utils'
import toast from 'react-hot-toast'
import { User, Save } from 'lucide-react'

export default function CoacheeProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [wheel, setWheel] = useState<Record<string, number>>({})
  const wheelLabels = wheelOfLifeLabels()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      if (data?.wheel_of_life) setWheel(data.wheel_of_life)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        objectives: profile.objectives,
        wheel_of_life: wheel,
      })
      .eq('id', user.id)

    if (error) { toast.error('Erro ao salvar'); setLoading(false); return }
    toast.success('Perfil atualizado!')
    setLoading(false)
  }

  if (!profile) return <div className="p-8 text-charcoal-400">Carregando...</div>

  return (
    <div className="p-8 max-w-2xl animate-in">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-cream-200 rounded-2xl flex items-center justify-center">
            <span className="text-charcoal-700 font-display font-semibold text-xl">
              {getInitials(profile.full_name)}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-charcoal-800">{profile.full_name}</h1>
            <p className="text-charcoal-400 text-sm">{profile.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-charcoal-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Dados pessoais
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome completo</label>
              <input type="text" className="input" value={profile.full_name ?? ''}
                onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input type="tel" className="input" value={profile.phone ?? ''}
                onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">CPF</label>
              <input type="text" className="input" value={profile.cpf ?? ''} disabled className="input bg-cream-50 text-charcoal-400 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="label">Sobre você</label>
            <textarea className="input resize-none min-h-20" value={profile.bio ?? ''}
              onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
              placeholder="Conte um pouco sobre você..." />
          </div>
          <div>
            <label className="label">Seus objetivos</label>
            <textarea className="input resize-none min-h-20" value={profile.objectives ?? ''}
              onChange={e => setProfile((p: any) => ({ ...p, objectives: e.target.value }))}
              placeholder="O que você quer alcançar com o coaching?" />
          </div>
        </div>

        {/* Wheel of life */}
        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-charcoal-700">🎯 Roda da Vida</h2>
          <p className="text-xs text-charcoal-500">Avalie cada área de 0 a 10</p>
          <div className="space-y-4">
            {Object.entries(wheelLabels).map(([key, label]) => (
              <div key={key}>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-charcoal-700">{label}</label>
                  <span className="text-sm font-bold text-sage-600">{wheel[key] ?? 5}</span>
                </div>
                <input
                  type="range"
                  min="0" max="10"
                  value={wheel[key] ?? 5}
                  onChange={e => setWheel(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full accent-sage-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-charcoal-300 mt-0.5">
                  <span>0</span><span>5</span><span>10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 w-full justify-center">
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  )
}
