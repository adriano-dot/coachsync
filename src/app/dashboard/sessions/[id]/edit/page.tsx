'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Sparkles, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditSessionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const [title,           setTitle]           = useState('')
  const [sessionDate,     setSessionDate]     = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes,           setNotes]           = useState('')
  const [transcriptText,  setTranscriptText]  = useState('')
  const [coacheeId,       setCoacheeId]       = useState('')
  const [hasAiSummary,    setHasAiSummary]    = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) { toast.error('Sessão não encontrada'); router.push('/dashboard/sessions'); return }

      setTitle(data.title ?? '')
      setSessionDate(data.session_date?.split('T')[0] ?? '')
      setDurationMinutes(String(data.duration_minutes ?? '60'))
      setNotes(data.notes ?? '')
      setTranscriptText(data.transcript_text ?? '')
      setCoacheeId(data.coachee_id)
      setHasAiSummary(!!data.ai_summary)
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('sessions').update({
      title,
      session_date:     sessionDate,
      duration_minutes: parseInt(durationMinutes) || 60,
      notes,
      transcript_text:  transcriptText || null,
    }).eq('id', params.id)

    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
    toast.success('Sessão atualizada!')
    setSaving(false)
  }

  async function handleAnalyze() {
    if (!transcriptText.trim()) { toast.error('Adicione uma transcrição para analisar'); return }
    setAnalyzing(true)
    toast.loading('Analisando com IA...')

    // Save transcript first
    await supabase.from('sessions').update({ transcript_text: transcriptText, status: 'completed' }).eq('id', params.id)

    const res = await fetch('/api/sessions/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: params.id, transcript: transcriptText, coachee_id: coacheeId }),
    })

    toast.dismiss()
    if (res.ok) {
      toast.success('Resumo gerado com IA! ✨')
      setHasAiSummary(true)
      setTimeout(() => router.push(`/dashboard/sessions/${params.id}`), 1200)
    } else {
      toast.error('Erro ao gerar resumo')
    }
    setAnalyzing(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-charcoal-400" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl animate-in">
      <Link href={`/dashboard/sessions/${params.id}`}
        className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar para a sessão
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Editar sessão</h1>
        <p className="text-charcoal-500 text-sm mt-1">Atualize os dados ou adicione a transcrição para gerar o resumo com IA.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="font-display text-base font-semibold text-charcoal-700">Informações da sessão</h2>
          <div>
            <label className="label">Título</label>
            <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
            </div>
            <div>
              <label className="label">Duração (min)</label>
              <input type="number" className="input" value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)} min="15" max="240" />
            </div>
          </div>
          <div>
            <label className="label">Notas do coach</label>
            <textarea className="input resize-none min-h-24" value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="Observações, impressões, pontos de atenção..." />
          </div>
        </div>

        {/* Transcript */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-charcoal-700">Transcrição</h2>
            {hasAiSummary && (
              <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Resumo IA já gerado
              </span>
            )}
          </div>
          <div>
            <label className="label">Texto da transcrição</label>
            <textarea
              className="input resize-none min-h-48 font-mono text-xs"
              value={transcriptText}
              onChange={e => setTranscriptText(e.target.value)}
              placeholder="Cole aqui a transcrição da sessão (do Google Meet, Zoom, áudio transcrito, etc.)&#10;&#10;Formato recomendado:&#10;[00:01] Coach: ...&#10;[00:45] Coachee: ..."
            />
            <p className="text-xs text-charcoal-400 mt-1.5">
              Quanto mais completa a transcrição, melhor o resumo gerado pela IA.
            </p>
          </div>

          {/* Analyze button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !transcriptText.trim()}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {analyzing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando resumo com IA...</>
              : <><Sparkles className="w-4 h-4" /> {hasAiSummary ? 'Regerar resumo com IA' : 'Gerar resumo com IA'}</>
            }
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
