'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, BarChart3, RefreshCw } from 'lucide-react'
import Link from 'next/link'

// ── DISC Questions ─────────────────────────────────────────────────
const QUESTIONS: { id: number; text: string; options: { label: string; disc: 'D' | 'I' | 'S' | 'C' }[] }[] = [
  {
    id: 1, text: 'Ao enfrentar um desafio novo, você tende a:',
    options: [
      { label: 'Tomar a frente e agir imediatamente', disc: 'D' },
      { label: 'Entusiasmar a equipe e buscar apoio', disc: 'I' },
      { label: 'Analisar com calma antes de agir', disc: 'S' },
      { label: 'Pesquisar dados e planejar detalhadamente', disc: 'C' },
    ],
  },
  {
    id: 2, text: 'Em reuniões, você geralmente:',
    options: [
      { label: 'Vai direto ao ponto e decide rápido', disc: 'D' },
      { label: 'Conta histórias e anima o grupo', disc: 'I' },
      { label: 'Ouve mais do que fala', disc: 'S' },
      { label: 'Faz perguntas técnicas e verifica detalhes', disc: 'C' },
    ],
  },
  {
    id: 3, text: 'Quando alguém discorda de você, você tende a:',
    options: [
      { label: 'Defender sua posição com firmeza', disc: 'D' },
      { label: 'Tentar convencer com carisma', disc: 'I' },
      { label: 'Ceder para manter a harmonia', disc: 'S' },
      { label: 'Apresentar evidências para embasar sua posição', disc: 'C' },
    ],
  },
  {
    id: 4, text: 'Seu ritmo de trabalho preferido é:',
    options: [
      { label: 'Rápido, intenso e com resultados imediatos', disc: 'D' },
      { label: 'Dinâmico, com interação e variedade', disc: 'I' },
      { label: 'Constante, estável e previsível', disc: 'S' },
      { label: 'Metódico, com processos claros e qualidade', disc: 'C' },
    ],
  },
  {
    id: 5, text: 'O que mais te motiva no trabalho:',
    options: [
      { label: 'Poder, resultados e vencer desafios', disc: 'D' },
      { label: 'Reconhecimento e conexão com pessoas', disc: 'I' },
      { label: 'Estabilidade e contribuir para a equipe', disc: 'S' },
      { label: 'Precisão, qualidade e fazer o certo', disc: 'C' },
    ],
  },
  {
    id: 6, text: 'Como você lida com erros?',
    options: [
      { label: 'Assume, corrige e segue em frente rapidamente', disc: 'D' },
      { label: 'Fala abertamente e pede ajuda ao grupo', disc: 'I' },
      { label: 'Tende a ser autocrítico e rever o processo', disc: 'S' },
      { label: 'Analisa a causa raiz e cria um plano para não repetir', disc: 'C' },
    ],
  },
  {
    id: 7, text: 'Na hora de tomar decisões, você:',
    options: [
      { label: 'Decide rápido com base na intuição e resultado', disc: 'D' },
      { label: 'Considera como afetará as pessoas envolvidas', disc: 'I' },
      { label: 'Prefere consenso e evita mudanças abruptas', disc: 'S' },
      { label: 'Precisa de dados suficientes antes de concluir', disc: 'C' },
    ],
  },
  {
    id: 8, text: 'Em situações de pressão, você:',
    options: [
      { label: 'Fica mais assertivo e focado no controle', disc: 'D' },
      { label: 'Busca conversar e aliviar o clima', disc: 'I' },
      { label: 'Tende a absorver e evitar conflito', disc: 'S' },
      { label: 'Isola e foca na análise do problema', disc: 'C' },
    ],
  },
  {
    id: 9, text: 'Como você prefere receber feedback:',
    options: [
      { label: 'Direto, objetivo e sem rodeios', disc: 'D' },
      { label: 'Positivo, encorajador e com entusiasmo', disc: 'I' },
      { label: 'Gentil, empático e em particular', disc: 'S' },
      { label: 'Detalhado, preciso e com exemplos concretos', disc: 'C' },
    ],
  },
  {
    id: 10, text: 'Qual frase mais combina com você:',
    options: [
      { label: '"Feito é melhor que perfeito."', disc: 'D' },
      { label: '"A vida é melhor quando você ri."', disc: 'I' },
      { label: '"Devagar e sempre."', disc: 'S' },
      { label: '"Se vale a pena fazer, vale a pena fazer direito."', disc: 'C' },
    ],
  },
]

const DISC_INFO: Record<'D' | 'I' | 'S' | 'C', {
  label: string; color: string; bg: string; border: string; emoji: string
  description: string; strengths: string[]; challenges: string[]
}> = {
  D: {
    label: 'Dominância', emoji: '🦁', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
    description: 'Pessoas com perfil D são orientadas a resultados, diretas e decisivas. Assumem o controle naturalmente e prosperam em ambientes competitivos.',
    strengths: ['Liderança natural', 'Tomada de decisão rápida', 'Orientação a resultados', 'Assertividade'],
    challenges: ['Pode parecer impaciente', 'Dificuldade em ouvir', 'Tende ao perfeccionismo imediatista'],
  },
  I: {
    label: 'Influência', emoji: '🌟', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    description: 'Pessoas com perfil I são entusiastas, comunicativas e motivadoras. Criam conexões facilmente e energizam os ambientes onde estão.',
    strengths: ['Comunicação carismática', 'Criatividade', 'Trabalho em equipe', 'Otimismo'],
    challenges: ['Pode se dispersar', 'Dificuldade com detalhes', 'Tende a evitar conflitos diretos'],
  },
  S: {
    label: 'Estabilidade', emoji: '🌿', color: 'text-sage-600', bg: 'bg-sage-50', border: 'border-sage-200',
    description: 'Pessoas com perfil S são pacientes, confiáveis e colaborativas. São o alicerce dos times e valorizam relacionamentos duradouros.',
    strengths: ['Empatia profunda', 'Consistência', 'Escuta ativa', 'Lealdade'],
    challenges: ['Resistência a mudanças', 'Dificuldade em dizer não', 'Tende a absorver conflitos'],
  },
  C: {
    label: 'Conformidade', emoji: '🔬', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
    description: 'Pessoas com perfil C são analíticas, metódicas e precisas. Garantem a qualidade e seguem processos com rigor.',
    strengths: ['Pensamento analítico', 'Atenção a detalhes', 'Precisão', 'Organização'],
    challenges: ['Pode ser excessivamente crítico', 'Paralisia por análise', 'Dificuldade com ambiguidade'],
  },
}

function DiscBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-charcoal-700">{label}</span>
        <span className="text-charcoal-500">{value} pts</span>
      </div>
      <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DiscPage() {
  const supabase = createClient()
  const [answers, setAnswers] = useState<Record<number, 'D' | 'I' | 'S' | 'C'>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ D: number; I: number; S: number; C: number } | null>(null)
  const [saved, setSaved] = useState(false)

  const total = QUESTIONS.length
  const answered = Object.keys(answers).length
  const progress = (answered / total) * 100

  function selectOption(disc: 'D' | 'I' | 'S' | 'C') {
    const qId = QUESTIONS[currentQ].id
    setAnswers(prev => ({ ...prev, [qId]: disc }))
    if (currentQ < total - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 280)
    }
  }

  function calculate() {
    const scores = { D: 0, I: 0, S: 0, C: 0 }
    Object.values(answers).forEach(disc => scores[disc]++)
    setResult(scores)
  }

  async function saveResult() {
    if (!result) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const total = Object.values(result).reduce((s, v) => s + v, 0) || 1
    const profile = {
      dominance:       Math.round((result.D / total) * 100),
      influence:       Math.round((result.I / total) * 100),
      steadiness:      Math.round((result.S / total) * 100),
      conscientiousness: Math.round((result.C / total) * 100),
    }
    const { error } = await supabase.from('profiles').update({ behavioral_profile: profile }).eq('id', user.id)
    if (error) { toast.error('Erro ao salvar resultado'); setSaving(false); return }
    toast.success('Perfil DISC salvo!')
    setSaved(true)
    setSaving(false)
  }

  function reset() {
    setAnswers({})
    setCurrentQ(0)
    setResult(null)
    setSaved(false)
  }

  // ── Result screen ─────────────────────────────────────────────
  if (result) {
    const maxScore = Math.max(...Object.values(result))
    const dominant = (Object.entries(result) as [keyof typeof result, number][])
      .sort(([, a], [, b]) => b - a)[0][0]
    const info = DISC_INFO[dominant]

    return (
      <div className="p-8 max-w-2xl animate-in">
        <Link href="/coachee/profile" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao perfil
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">{info.emoji}</div>
          <div>
            <h1 className="font-display text-2xl font-bold text-charcoal-900">Seu perfil: {info.label}</h1>
            <p className="text-charcoal-500 text-sm">Estilo comportamental predominante</p>
          </div>
        </div>

        {/* Score bars */}
        <div className={cn('card mb-6', info.bg, info.border)}>
          <h2 className="font-display text-base font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Distribuição do perfil
          </h2>
          <div className="space-y-4">
            <DiscBar label="D — Dominância"    value={result.D} max={maxScore} color="bg-red-500" />
            <DiscBar label="I — Influência"    value={result.I} max={maxScore} color="bg-amber-500" />
            <DiscBar label="S — Estabilidade"  value={result.S} max={maxScore} color="bg-sage-500" />
            <DiscBar label="C — Conformidade"  value={result.C} max={maxScore} color="bg-blue-500" />
          </div>
        </div>

        {/* Description */}
        <div className="card mb-4">
          <h2 className="font-display text-base font-semibold text-charcoal-800 mb-2">Como você age</h2>
          <p className="text-sm text-charcoal-600 leading-relaxed">{info.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card bg-sage-50 border-sage-200">
            <h3 className="text-sm font-semibold text-sage-800 mb-2">✅ Pontos fortes</h3>
            <ul className="space-y-1">
              {info.strengths.map(s => (
                <li key={s} className="text-xs text-sage-700 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card bg-amber-50 border-amber-200">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">⚡ Pontos de atenção</h3>
            <ul className="space-y-1">
              {info.challenges.map(c => (
                <li key={c} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-3 border border-cream-300 rounded-xl text-sm text-charcoal-600 hover:bg-cream-100 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refazer
          </button>
          {!saved ? (
            <button onClick={saveResult} disabled={saving}
              className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Salvar no meu perfil</>}
            </button>
          ) : (
            <Link href="/coachee/profile"
              className="flex-1 bg-charcoal-800 hover:bg-charcoal-900 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
              Ver meu perfil completo <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ── Quiz screen ───────────────────────────────────────────────
  const q = QUESTIONS[currentQ]
  return (
    <div className="p-8 max-w-xl animate-in">
      <Link href="/coachee/profile" className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-charcoal-900 mb-1">Perfil Comportamental DISC</h1>
        <p className="text-charcoal-500 text-sm">Escolha a opção que mais representa você. Não há resposta certa ou errada.</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-charcoal-400 mb-2">
          <span>Questão {currentQ + 1} de {total}</span>
          <span>{answered} respondidas</span>
        </div>
        <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
          <div className="h-full bg-sage-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="card mb-6">
        <p className="text-base font-medium text-charcoal-800 leading-relaxed">{q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map(opt => {
          const selected = answers[q.id] === opt.disc
          return (
            <button
              key={opt.disc}
              onClick={() => selectOption(opt.disc)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm',
                selected
                  ? 'border-sage-500 bg-sage-50 text-charcoal-800'
                  : 'border-cream-200 bg-white hover:border-sage-300 hover:bg-cream-50 text-charcoal-700'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                  selected ? 'border-sage-500 bg-sage-500' : 'border-cream-300'
                )}>
                  {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                {opt.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-2 px-4 py-2.5 border border-cream-300 rounded-xl text-sm text-charcoal-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        {answered === total ? (
          <button
            onClick={calculate}
            className="bg-sage-500 hover:bg-sage-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            Ver resultado <BarChart3 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ(c => Math.min(total - 1, c + 1))}
            disabled={!answers[q.id]}
            className="flex items-center gap-2 px-4 py-2.5 bg-sage-500 text-white rounded-xl text-sm font-medium hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
