'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getInitials } from '@/lib/utils'
import { Plus, Search, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'

export default function CoacheesPage() {
  const [loading, setLoading] = useState(true)
  const [coachees, setCoachees] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('coach_id', user.id)
        .eq('role', 'coachee')
        .order('created_at', { ascending: false })

      setCoachees(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = coachees.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-cream-100 rounded-xl w-32" />
        <div className="h-10 bg-cream-100 rounded-xl w-72" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-cream-100 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">Coachees</h1>
          <p className="text-charcoal-500 text-sm mt-1">{coachees.length} clientes cadastrados</p>
        </div>
        <Link href="/dashboard/coachees/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Coachee
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <input
          type="text"
          placeholder="Buscar coachees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10 max-w-sm"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(coachee => (
            <Link
              key={coachee.id}
              href={`/dashboard/coachees/${coachee.id}`}
              className="card-hover flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                {coachee.avatar_url ? (
                  <img src={coachee.avatar_url} alt={coachee.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-sage-700 font-semibold">{getInitials(coachee.full_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal-800">{coachee.full_name}</p>
                <p className="text-sm text-charcoal-400">{coachee.email}</p>
                {coachee.objectives && (
                  <p className="text-xs text-charcoal-500 mt-1 truncate max-w-md">{coachee.objectives}</p>
                )}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <span className={`badge text-xs ${
                    coachee.onboarding_step === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {coachee.onboarding_step === 'completed' ? 'Ativo' : 'Onboarding'}
                  </span>
                  <p className="text-xs text-charcoal-400 mt-1">desde {formatDate(coachee.created_at)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-charcoal-300" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-charcoal-400" />
          </div>
          <h3 className="font-display text-xl font-semibold text-charcoal-700 mb-2">
            {search ? 'Nenhum resultado encontrado' : 'Nenhum coachee ainda'}
          </h3>
          <p className="text-charcoal-400 text-sm mb-6">
            {search ? 'Tente outro termo de busca' : 'Cadastre seu primeiro coachee para começar'}
          </p>
          {!search && (
            <Link href="/dashboard/coachees/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar coachee
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
