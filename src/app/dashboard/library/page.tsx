'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { BookOpen, Plus, Trash2, X } from 'lucide-react'
import type { LibraryItem, CoacheeProfile } from '@/types'

const TYPES = [
  { value: 'book', label: '📚 Livro' },
  { value: 'movie', label: '🎬 Filme' },
  { value: 'article', label: '📄 Artigo' },
  { value: 'podcast', label: '🎧 Podcast' },
  { value: 'exercise', label: '💪 Exercício' },
  { value: 'other', label: '📦 Outro' },
]

export default function LibraryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [coachees, setCoachees] = useState<CoacheeProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', author: '', type: 'book', description: '', url: '', coachee_id: '', tags: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: libItems }, { data: coacheeList }] = await Promise.all([
      supabase.from('library_items').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('coach_id', user.id).eq('role', 'coachee'),
    ])
    setItems(libItems ?? [])
    setCoachees(coacheeList ?? [])
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('library_items').insert({
      coach_id: user.id,
      title: form.title,
      author: form.author || null,
      type: form.type,
      description: form.description || null,
      url: form.url || null,
      coachee_id: form.coachee_id || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
    })

    if (error) { toast.error('Erro ao adicionar'); return }
    toast.success('Item adicionado!')
    setShowForm(false)
    setForm({ title: '', author: '', type: 'book', description: '', url: '', coachee_id: '', tags: '' })
    load()
  }

  async function deleteItem(id: string) {
    await supabase.from('library_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Item removido')
  }

  return (
    <div className="p-8 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">Biblioteca</h1>
          <p className="text-charcoal-500 text-sm mt-1">Recursos para seus coachees</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar item
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-6 border-sage-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-charcoal-800">Novo item</h2>
            <button onClick={() => setShowForm(false)} className="text-charcoal-400 hover:text-charcoal-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={addItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Título *</label>
                <input type="text" className="input" required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Autor</label>
                <input type="text" className="input" value={form.author}
                  onChange={e => setForm(p => ({ ...p, author: e.target.value }))} />
              </div>
              <div>
                <label className="label">URL (opcional)</label>
                <input type="url" className="input" placeholder="https://..." value={form.url}
                  onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
              </div>
              <div>
                <label className="label">Para qual coachee?</label>
                <select className="input" value={form.coachee_id}
                  onChange={e => setForm(p => ({ ...p, coachee_id: e.target.value }))}>
                  <option value="">Todos os coachees</option>
                  {coachees.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tags (separadas por vírgula)</label>
                <input type="text" className="input" placeholder="liderança, autoconhecimento" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea className="input resize-none min-h-20" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" className="btn-primary flex-1">Adicionar</button>
            </div>
          </form>
        </div>
      )}

      {/* Items grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{TYPES.find(t => t.value === item.type)?.label.split(' ')[0]}</span>
                    <p className="font-medium text-charcoal-800 truncate">{item.title}</p>
                  </div>
                  {item.author && <p className="text-xs text-charcoal-400">{item.author}</p>}
                  {item.description && (
                    <p className="text-xs text-charcoal-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}
                  {(item as any).coachee_id && (
                    <p className="text-xs text-sage-600 mt-1">
                      Para: {coachees.find(c => c.id === (item as any).coachee_id)?.full_name ?? 'coachee específico'}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-charcoal-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="card text-center py-12">
            <BookOpen className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="text-charcoal-500 text-sm">Nenhum item na biblioteca ainda</p>
          </div>
        )
      )}
    </div>
  )
}
