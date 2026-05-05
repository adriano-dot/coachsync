'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Sparkles, Pause, Play, Leaf, Clock, Circle
} from 'lucide-react'
import type { AISummary } from '@/types'

// ─── Types ────────────────────────────────────────────────────────
interface TranscriptLine {
  speaker: 'coach' | 'coachee'
  name: string
  text: string
  timestamp: string
}

interface LiveInsights {
  emotions: { abertura: number; ansiedade: number; motivacao: number; resistencia: number }
  themes: string[]
  commitments: string[]
  cautions: string[]
  suggestedQuestions: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

// ─── Live Session Component ──────────────────────────────────────
export default function LiveSessionPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  // Session state
  const [sessionId] = useState(params.get('session_id') ?? '')
  const [coacheeName] = useState(params.get('coachee_name') ?? 'Coachee')
  const [meetUrl] = useState(params.get('meet_url') ?? '')
  const [coachName, setCoachName] = useState('')

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  // Controls
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [transcriptRunning, setTranscriptRunning] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)

  // Transcript
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [notes, setNotes] = useState('')
  const transcriptScrollRef = useRef<HTMLDivElement>(null)

  // AI insights
  const [insights, setInsights] = useState<LiveInsights>({
    emotions: { abertura: 0, ansiedade: 0, motivacao: 0, resistencia: 0 },
    themes: [],
    commitments: [],
    cautions: [],
    suggestedQuestions: [],
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)

  // Speech recognition
  const recognitionRef = useRef<any>(null)
  const fullTranscriptRef = useRef('')

  // ── Load profile ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => setCoachName(data?.full_name ?? 'Coach'))
    })
  }, [])

  // ── Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // ── Speech Recognition (Web Speech API) ──────────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Transcrição automática requer Chrome ou Edge')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'pt-BR'

    recognition.onresult = (event: any) => {
      if (!transcriptRunning) return
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript
        }
      }
      if (finalText.trim()) {
        const now = formatTime(elapsed)
        const newLine: TranscriptLine = {
          speaker: 'coach', // In real app: detect via audio source/diarization
          name: coachName,
          text: finalText.trim(),
          timestamp: now,
        }
        setLines(prev => [...prev, newLine])
        fullTranscriptRef.current += `\n[${now}] ${coachName}: ${finalText.trim()}`
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') console.error('Speech recognition error:', e.error)
    }

    recognition.onend = () => {
      if (transcriptRunning && recognitionRef.current) {
        recognition.start() // Restart on end
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch (err) { /* already started */ }

    return () => {
      recognitionRef.current = null
      try { recognition.stop() } catch { /* ignore */ }
    }
  }, [coachName])

  // Toggle transcript
  useEffect(() => {
    if (!recognitionRef.current) return
    if (transcriptRunning) {
      try { recognitionRef.current.start() } catch { /* already running */ }
    } else {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
  }, [transcriptRunning])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight
    }
  }, [lines])

  // ── Auto-analysis every 30s ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (fullTranscriptRef.current.length > 100) {
        runLiveAnalysis()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // ── Live AI Analysis ──────────────────────────────────────────────
  const runLiveAnalysis = useCallback(async () => {
    if (analyzing || fullTranscriptRef.current.length < 50) return
    setAnalyzing(true)

    try {
      const res = await fetch('/api/sessions/live-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscriptRef.current,
          coachee_name: coacheeName,
          elapsed_seconds: elapsed,
        }),
      })
      const data = await res.json()
      if (data.insights) {
        setInsights(data.insights)
        setLastAnalysis(new Date())
      }
    } catch (err) {
      console.error('Live analysis error:', err)
    } finally {
      setAnalyzing(false)
    }
  }, [analyzing, coacheeName, elapsed])

  // ── Add manual transcript line (for coachee simulation) ──────────
  function addManualLine(speaker: 'coach' | 'coachee', text: string) {
    const newLine: TranscriptLine = {
      speaker,
      name: speaker === 'coach' ? coachName : coacheeName,
      text,
      timestamp: formatTime(elapsed),
    }
    setLines(prev => [...prev, newLine])
    fullTranscriptRef.current += `\n[${newLine.timestamp}] ${newLine.name}: ${text}`
  }

  // ── Notes auto-save ────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (sessionId) {
        supabase.from('sessions').update({ notes }).eq('id', sessionId).then(() => {})
      }
    }, 1500)
    return () => clearTimeout(timeout)
  }, [notes])

  // ── End session ───────────────────────────────────────────────
  async function endAndGenerateSummary() {
    setShowEndModal(false)
    toast.loading('Gerando resumo com IA...')

    const transcriptText = fullTranscriptRef.current
    if (!transcriptText || !sessionId) {
      toast.dismiss()
      toast.error('Sem transcrição para processar')
      router.push('/dashboard')
      return
    }

    // Save transcript then trigger summarize
    await supabase.from('sessions').update({
      transcript_text: transcriptText,
      duration_minutes: Math.round(elapsed / 60),
      status: 'completed',
    }).eq('id', sessionId)

    const res = await fetch('/api/sessions/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        transcript: transcriptText,
        coachee_id: params.get('coachee_id'),
      }),
    })

    toast.dismiss()
    if (res.ok) {
      toast.success('Resumo gerado! Redirecionando...')
      setTimeout(() => router.push(`/dashboard/sessions/${sessionId}`), 1500)
    } else {
      toast.error('Erro ao gerar resumo')
      router.push(`/dashboard/sessions/${sessionId}`)
    }
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-charcoal-900 text-white overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="h-13 flex items-center px-5 gap-4 border-b border-white/8 bg-black/50 flex-shrink-0 z-50" style={{ height: 52 }}>
        <div className="flex items-center gap-2 font-display text-base font-semibold">
          <div className="w-6 h-6 rounded-lg bg-sage-500 flex items-center justify-center">
            <Leaf className="w-3 h-3 text-white" />
          </div>
          CoachSync
        </div>
        <div className="w-px h-5 bg-white/10" />
        <p className="text-sm text-white/60">
          Sessão ao vivo com <strong className="text-white font-medium">{coacheeName}</strong>
        </p>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400 tracking-wide">AO VIVO</span>
        </div>

        <code className="text-sm text-white/60 font-mono">{formatTime(elapsed)}</code>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-sm text-white/60">
          <div className="w-7 h-7 rounded-full bg-sage-600 flex items-center justify-center text-xs font-semibold">
            {coacheeName.charAt(0)}
          </div>
          <span><strong className="text-white">{coacheeName}</strong></span>
        </div>

        <button
          onClick={() => setShowEndModal(true)}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <PhoneOff className="w-3 h-3" />
          Encerrar sessão
        </button>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '1fr 300px 300px' }}>

        {/* ── VIDEO PANEL ── */}
        <div className="bg-black flex flex-col border-r border-white/6">
          <div className="flex-1 relative">
            {meetUrl ? (
              /* Real Google Meet embed */
              <iframe
                src={meetUrl}
                className="w-full h-full border-none"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                allowFullScreen
              />
            ) : (
              /* Placeholder when no Meet URL */
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-4">
                <div className="grid grid-cols-2 gap-3 w-full h-full p-3">
                  {/* Coach tile */}
                  <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3 border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-sage-600/30 border-2 border-sage-500/50 flex items-center justify-center font-display text-2xl font-semibold text-sage-400">
                      {coachName.charAt(0)}
                    </div>
                    <p className="text-sm text-white/70">{coachName} (você)</p>
                    <span className="text-xs text-white/40 bg-black/40 px-2.5 py-0.5 rounded-full">🎙 Coach</span>
                  </div>
                  {/* Coachee tile */}
                  <div className="rounded-xl bg-gradient-to-br from-violet-950 to-slate-900 flex flex-col items-center justify-center gap-3 border-2 border-green-400/30 relative">
                    <div className="w-16 h-16 rounded-full bg-violet-600/30 border-2 border-violet-400/50 flex items-center justify-center font-display text-2xl font-semibold text-violet-300">
                      {coacheeName.charAt(0)}
                    </div>
                    <p className="text-sm text-white/70">{coacheeName}</p>
                    <span className="text-xs text-white/40 bg-black/40 px-2.5 py-0.5 rounded-full">🎧 Coachee</span>
                    {/* Speaking indicator */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
                      <div className="flex items-end gap-0.5 h-3">
                        {[3, 8, 5, 10, 4].map((h, i) => (
                          <div key={i} className="w-0.5 bg-green-400 rounded-sm animate-bounce" style={{ height: h, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-white/50">falando</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-14 left-0 right-0 text-center">
                  <p className="text-xs text-white/30">
                    Para integrar Google Meet: adicione <code className="text-white/50">?meet_url=https://meet.google.com/xxx</code> na URL
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meet controls */}
          <div className="h-14 bg-black/60 backdrop-blur border-t border-white/8 flex items-center justify-center gap-3 flex-shrink-0">
            {[
              { icon: micOn ? Mic : MicOff, label: micOn ? 'Mic' : 'Mudo', active: !micOn, action: () => setMicOn(!micOn) },
              { icon: camOn ? Video : VideoOff, label: 'Câmera', active: !camOn, action: () => setCamOn(!camOn) },
              { icon: MonitorUp, label: 'Tela', active: false, action: () => toast('Use os controles do Meet para compartilhar tela') },
              { icon: PhoneOff, label: 'Encerrar', active: true, danger: true, action: () => setShowEndModal(true) },
            ].map((ctrl, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={ctrl.action}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    ctrl.danger ? 'bg-red-500 hover:bg-red-600' :
                    ctrl.active ? 'bg-red-500/80 hover:bg-red-500' : 'bg-white/12 hover:bg-white/20'
                  }`}
                >
                  <ctrl.icon className="w-4 h-4" />
                </button>
                <span className="text-xs text-white/30">{ctrl.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TRANSCRIPT PANEL ── */}
        <div className="bg-white/3 border-r border-white/6 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/7 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Transcrição</span>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${
              transcriptRunning
                ? 'bg-green-500/15 border-green-500/25 text-green-400'
                : 'bg-white/6 border-white/10 text-white/40'
            }`}>
              <Circle className={`w-1.5 h-1.5 fill-current ${transcriptRunning ? 'animate-pulse' : ''}`} />
              {transcriptRunning ? 'Ao vivo' : 'Pausada'}
            </div>
          </div>

          <div ref={transcriptScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {lines.length === 0 && (
              <div className="text-center py-8">
                <div className="text-white/20 text-xs">Aguardando transcrição...</div>
                <div className="text-white/10 text-xs mt-1">Fale para começar</div>
              </div>
            )}
            {lines.map((line, i) => (
              <div key={i} className="animate-slide-up">
                <div className={`text-xs font-semibold tracking-wide uppercase mb-1 ${
                  line.speaker === 'coach' ? 'text-sage-400' : 'text-violet-400'
                }`}>
                  {line.name}
                </div>
                <div className={`text-xs leading-relaxed px-3 py-2 rounded-lg border-l-2 text-white/75 bg-white/4 ${
                  line.speaker === 'coach' ? 'border-sage-600' : 'border-violet-700'
                }`}>
                  {line.text}
                </div>
                <div className="text-xs text-white/25 font-mono mt-1">{line.timestamp}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="px-4 pt-3 pb-2 border-t border-white/7 flex-shrink-0">
            <div className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Notas rápidas</div>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-xs leading-relaxed resize-none outline-none focus:border-sage-500/50 placeholder-white/20 min-h-16"
              placeholder="Suas anotações durante a sessão..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="px-4 pb-3 flex-shrink-0">
            <button
              onClick={() => setTranscriptRunning(!transcriptRunning)}
              className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-colors ${
                transcriptRunning
                  ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                  : 'bg-green-500/12 text-green-400 border-green-500/25 hover:bg-green-500/20'
              }`}
            >
              {transcriptRunning ? <><Pause className="w-3 h-3" /> Pausar transcrição</> : <><Play className="w-3 h-3" /> Retomar transcrição</>}
            </button>
          </div>
        </div>

        {/* ── AI INSIGHTS PANEL ── */}
        <div className="bg-violet-950/20 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/7 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">IA em tempo real</span>
            <div className={`text-xs px-2.5 py-0.5 rounded-full border ${
              analyzing
                ? 'bg-violet-500/15 border-violet-500/25 text-violet-400 animate-pulse'
                : 'bg-violet-500/10 border-violet-500/20 text-violet-300'
            }`}>
              {analyzing ? '◌ Analisando...' : '✦ Ao vivo'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

            {analyzing && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
                <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin flex-shrink-0" />
                <span className="text-xs text-violet-300/80">Analisando transcrição...</span>
              </div>
            )}

            {/* Emotion meters */}
            <div className="bg-white/4 rounded-xl border border-white/7 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                <span className="text-sm">🎭</span>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Tom emocional</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                {[
                  { key: 'abertura', label: 'Abertura', color: 'from-violet-600 to-violet-400' },
                  { key: 'ansiedade', label: 'Ansiedade', color: 'from-amber-600 to-amber-400' },
                  { key: 'motivacao', label: 'Motivação', color: 'from-sage-600 to-sage-400' },
                  { key: 'resistencia', label: 'Resistência', color: 'from-amber-700 to-amber-500' },
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-white/60">{label}</span>
                      <span className="text-xs font-semibold text-white/80">
                        {insights.emotions[key as keyof typeof insights.emotions]}%
                      </span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1500`}
                        style={{ width: `${insights.emotions[key as keyof typeof insights.emotions]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Themes */}
            {insights.themes.length > 0 && (
              <div className="bg-white/4 rounded-xl border border-white/7 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                  <span className="text-sm">🔍</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Temas identificados</span>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                  {insights.themes.map((theme, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                      <p className="text-xs leading-relaxed text-white/70">{theme}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commitments */}
            {insights.commitments.length > 0 && (
              <div className="bg-white/4 rounded-xl border border-white/7 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Comprometimentos</span>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                  {insights.commitments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-green-500/8 rounded-lg border border-green-500/15">
                      <span className="text-xs flex-shrink-0">🟢</span>
                      <p className="text-xs text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: c }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cautions */}
            {insights.cautions.length > 0 && (
              <div className="bg-white/4 rounded-xl border border-white/7 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Atenção do coach</span>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                  {insights.cautions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-amber-500/8 rounded-lg border border-amber-500/15">
                      <span className="text-xs flex-shrink-0">⚡</span>
                      <p className="text-xs text-white/70 leading-relaxed">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {insights.suggestedQuestions.length > 0 && (
              <div className="bg-white/4 rounded-xl border border-white/7 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                  <span className="text-sm">💡</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Perguntas poderosas</span>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                  {insights.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigator.clipboard?.writeText(q)
                        toast.success('Copiado!')
                      }}
                      className="w-full flex items-start gap-2 p-2.5 bg-white/4 rounded-xl border border-white/7 hover:bg-violet-500/12 hover:border-violet-500/25 transition-all text-left"
                    >
                      <span className="text-xs font-mono font-semibold text-violet-500/70 flex-shrink-0 mt-0.5">0{i + 1}</span>
                      <p className="text-xs text-white/70 leading-relaxed">{q}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!analyzing && insights.themes.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-violet-500/30 mx-auto mb-3" />
                <p className="text-xs text-white/30">A IA vai analisar a conversa automaticamente</p>
                <p className="text-xs text-white/20 mt-1">ou clique em "Analisar agora"</p>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 border-t border-white/7 pt-3 flex-shrink-0 space-y-2">
            {lastAnalysis && (
              <p className="text-xs text-white/25 text-center">
                Última análise: {lastAnalysis.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <button
              onClick={runLiveAnalysis}
              disabled={analyzing}
              className="w-full py-2.5 bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-violet-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3" />
              {analyzing ? 'Analisando...' : 'Analisar agora'}
            </button>
          </div>
        </div>
      </div>

      {/* ── END SESSION MODAL ── */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-charcoal-800 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="font-display text-xl font-semibold text-white mb-2">Encerrar sessão?</h2>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              A IA vai processar toda a transcrição e gerar automaticamente o resumo completo, tarefas e próximos passos.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: formatTime(elapsed), label: 'Duração' },
                { value: lines.length, label: 'Trechos' },
                { value: insights.commitments.length, label: 'Comprometimentos' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/8 rounded-xl py-3">
                  <div className="font-display text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/35 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button onClick={endAndGenerateSummary} className="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Encerrar e gerar resumo com IA
              </button>
              <button onClick={() => setShowEndModal(false)} className="w-full py-3 bg-white/7 hover:bg-white/12 text-white/60 border border-white/10 rounded-xl text-sm font-medium transition-colors">
                Continuar sessão
              </button>
              <button onClick={() => { setShowEndModal(false); router.push('/dashboard') }} className="w-full py-3 bg-red-500/12 hover:bg-red-500/22 text-red-400 border border-red-500/25 rounded-xl text-sm font-medium transition-colors">
                Encerrar sem resumo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
