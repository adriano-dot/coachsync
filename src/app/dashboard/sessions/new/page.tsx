'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Video, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { CoacheeProfile } from '@/types'

export default function NewSessionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'live' | 'record'>('live')
  const [coachees, setCoachees] = useState<CoacheeProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ coachee_id:'', title:'', meet_url:'', session_date: new Date().toISOString().split('T')[0], duration_minutes:'60', notes:'', transcript_text:'' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('coach_id', user.id).eq('role','coachee')
        .then(({ data }) => setCoachees(data ?? []))
    })
  }, [])

  const up = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function startLive() {
    if (!form.coachee_id) { toast.error('Selecione um coachee'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch('/api/sessions/create-live', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ coach_id: user.id, coachee_id: form.coachee_id, title: form.title, meet_url: form.meet_url || null }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoading(false); return }
    router.push(data.live_url)
  }

  async function saveRecorded(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: session, error } = await supabase.from('sessions').insert({
      coach_id: user.id, coachee_id: form.coachee_id, title: form.title,
      session_date: form.session_date, duration_minutes: parseInt(form.duration_minutes),
      notes: form.notes, transcript_text: form.transcript_text || null, status:'completed',
    }).select().single()
    if (error) { toast.error('Erro ao salvar'); setLoading(false); return }
    toast.success('Sessão salva!')
    if (form.transcript_text) {
      await fetch('/api/sessions/summarize', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ session_id: session.id, transcript: form.transcript_text, coachee_id: form.coachee_id }),
      })
      toast.success('Resumo gerado! ✨')
    }
    router.push(`/dashboard/sessions/${session.id}`)
  }

  return (
    <div className="p-8 max-w-2xl animate-in">
      <Link href="/dashboard" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <h1 className="font-display text-3xl font-semibold text-charcoal-800 mb-2">Nova sessão</h1>
      <p className="text-charcoal-500 text-sm mb-8">Ao vivo com IA em tempo real, ou registre uma sessão passada</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { id:'live', icon: Video, color:'bg-green-100 text-green-600', title:'Sessão ao vivo', desc:'Meet + transcrição automática + IA em tempo real' },
          { id:'record', icon: FileText, color:'bg-violet-100 text-violet-600', title:'Registrar sessão', desc:'Upload de transcrição ou áudio com resumo IA' },
        ].map(opt => (
          <button key={opt.id} type="button" onClick={() => setMode(opt.id as any)}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${mode === opt.id ? 'border-sage-500 bg-sage-50' : 'border-cream-300 bg-white hover:border-cream-400'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${opt.color}`}>
              <opt.icon className="w-4 h-4" />
            </div>
            <div className="font-semibold text-charcoal-800 mb-1">{opt.title}</div>
            <div className="text-xs text-charcoal-400 leading-relaxed">{opt.desc}</div>
          </button>
        ))}
      </div>

      {mode === 'live' && (
        <div className="space-y-5">
          <div className="card space-y-4">
            <div>
              <label className="label">Coachee *</label>
              <select className="input" value={form.coachee_id} onChange={e => up('coachee_id', e.target.value)}>
                <option value="">Selecione o coachee</option>
                {coachees.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Título (opcional)</label>
              <input type="text" className="input" placeholder="Ex: Sessão 6 — Liderança" value={form.title} onChange={e => up('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Link Google Meet (opcional)</label>
              <input type="url" className="input" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={form.meet_url} onChange={e => up('meet_url', e.target.value)} />
              <p className="text-xs text-charcoal-400 mt-1">A transcrição funciona com ou sem o link do Meet.</p>
            </div>
          </div>
          <div className="card bg-sage-50 border-sage-200">
            <h3 className="font-semibold text-sage-800 mb-2 text-sm">✨ O que acontece ao iniciar</h3>
            <ul className="space-y-1 text-xs text-sage-700">
              {['Transcrição automática via Web Speech API (Chrome/Edge)','IA analisa a conversa a cada 30 segundos','Perguntas poderosas sugeridas em tempo real','Comprometimentos detectados automaticamente','Ao encerrar: resumo completo gerado com IA'].map(t => (
                <li key={t} className="flex items-start gap-2"><span>→</span>{t}</li>
              ))}
            </ul>
          </div>
          <button onClick={startLive} disabled={loading || !form.coachee_id} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Video className="w-4 h-4" />
            {loading ? 'Iniciando...' : 'Iniciar sessão ao vivo'}
          </button>
        </div>
      )}

      {mode === 'record' && (
        <form onSubmit={saveRecorded} className="space-y-5">
          <div className="card space-y-4">
            <div>
              <label className="label">Coachee *</label>
              <select className="input" value={form.coachee_id} onChange={e => up('coachee_id', e.target.value)} required>
                <option value="">Selecione</option>
                {coachees.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Título *</label>
              <input type="text" className="input" value={form.title} onChange={e => up('title', e.target.value)} required placeholder="Ex: Sessão 5 — Liderança e propósito" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Data *</label><input type="date" className="input" value={form.session_date} onChange={e => up('session_date', e.target.value)} required /></div>
              <div><label className="label">Duração (min)</label><input type="number" className="input" value={form.duration_minutes} onChange={e => up('duration_minutes', e.target.value)} min="15" max="240" /></div>
            </div>
            <div>
              <label className="label">Transcrição (para IA gerar resumo)</label>
              <textarea className="input min-h-36 resize-none font-mono text-xs" placeholder="Cole a transcrição da sessão..." value={form.transcript_text} onChange={e => up('transcript_text', e.target.value)} />
            </div>
            <div>
              <label className="label">Notas do coach</label>
              <textarea className="input min-h-20 resize-none" placeholder="Observações, impressões gerais..." value={form.notes} onChange={e => up('notes', e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar e analisar com IA'}
          </button>
        </form>
      )}
    </div>
  )
}
