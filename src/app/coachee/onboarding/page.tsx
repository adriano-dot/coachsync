'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Leaf, User, Activity, ClipboardList, Target,
  CheckCircle2, ArrowRight, ArrowLeft, Loader2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
type Step = 'profile' | 'wheel_of_life' | 'assessment' | 'goals' | 'completed'

interface WheelEntry { key: string; label: string; emoji: string }
const WHEEL: WheelEntry[] = [
  { key: 'career',          label: 'Carreira & Trabalho',    emoji: '💼' },
  { key: 'health',          label: 'Saúde & Energia',        emoji: '💪' },
  { key: 'relationships',   label: 'Relacionamentos',        emoji: '❤️' },
  { key: 'finances',        label: 'Finanças',               emoji: '💰' },
  { key: 'personal_growth', label: 'Desenvolvimento Pessoal', emoji: '🌱' },
  { key: 'leisure',         label: 'Lazer & Diversão',       emoji: '🎉' },
  { key: 'spirituality',    label: 'Espiritualidade',        emoji: '🧘' },
  { key: 'family',          label: 'Família',                emoji: '🏡' },
]

const ASSESSMENT_QUESTIONS = [
  { key: 'current_moment', label: 'Como você descreveria seu momento de vida atual?' },
  { key: 'biggest_challenge', label: 'Qual é seu maior desafio hoje?' },
  { key: 'previous_coaching', label: 'Você já passou por um processo de coaching antes? Como foi?' },
  { key: 'expectations', label: 'O que você espera alcançar com este processo?' },
  { key: 'commitment', label: 'Em uma escala de 0 a 10, qual seu nível de comprometimento com este processo? Por quê?' },
]

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'profile',       label: 'Perfil',         icon: User },
  { id: 'wheel_of_life', label: 'Roda da Vida',   icon: Activity },
  { id: 'assessment',   label: 'Diagnóstico',     icon: ClipboardList },
  { id: 'goals',        label: 'Objetivos',       icon: Target },
]

// ── Step indicator ────────────────────────────────────────────────
function StepIndicator({ current, steps }: { current: Step; steps: typeof STEPS }) {
  const currentIdx = steps.findIndex(s => s.id === current)
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => {
        const done = i < currentIdx
        const active = step.id === current
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              active ? 'bg-sage-500 text-white' :
              done   ? 'bg-sage-100 text-sage-600' :
              'bg-cream-100 text-charcoal-400'
            )}>
              {done
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <step.icon className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px w-6 flex-shrink-0', done ? 'bg-sage-300' : 'bg-cream-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Wheel slider ──────────────────────────────────────────────────
function WheelSlider({ entry, value, onChange }: { entry: WheelEntry; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-charcoal-700 flex items-center gap-2">
          <span>{entry.emoji}</span> {entry.label}
        </span>
        <span className={cn(
          'text-sm font-bold w-7 text-center',
          value >= 8 ? 'text-sage-600' : value >= 5 ? 'text-amber-600' : 'text-red-500'
        )}>
          {value}
        </span>
      </div>
      <input
        type="range" min={0} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-sage-500"
        style={{
          background: `linear-gradient(to right, rgb(var(--sage-500, 87 160 104)) ${value * 10}%, rgb(var(--cream-200, 232 228 219)) ${value * 10}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-charcoal-300">
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('profile')

  // Profile
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [cpf, setCpf]           = useState('')
  const [bio, setBio]           = useState('')

  // Wheel
  const [wheel, setWheel] = useState<Record<string, number>>(
    Object.fromEntries(WHEEL.map(w => [w.key, 5]))
  )

  // Assessment
  const [assessment, setAssessment] = useState<Record<string, string>>(
    Object.fromEntries(ASSESSMENT_QUESTIONS.map(q => [q.key, '']))
  )

  // Goals
  const [objectives, setObjectives] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setFullName(data.full_name ?? '')
        setPhone(data.phone ?? '')
        setCpf(data.cpf ?? '')
        setBio(data.bio ?? '')
        setObjectives(data.objectives ?? '')
        if (data.wheel_of_life) setWheel(data.wheel_of_life as Record<string, number>)
        if (data.initial_assessment) setAssessment(data.initial_assessment as Record<string, string>)
        // Resume from where they left off
        if (data.onboarding_step && data.onboarding_step !== 'completed') {
          setStep(data.onboarding_step as Step)
        }
      }
    }
    loadProfile()
  }, [])

  async function saveAndAdvance(nextStep: Step, payload: Record<string, any>) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      ...payload,
      onboarding_step: nextStep,
    }).eq('id', user.id)
    if (error) { toast.error('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    setStep(nextStep)
    setLoading(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function finish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      objectives,
      onboarding_step: 'completed',
    }).eq('id', user.id)
    setStep('completed')
    setLoading(false)
  }

  // ── Renders ────────────────────────────────────────────────────
  if (step === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-sage-500" />
          </div>
          <h1 className="font-display text-3xl font-bold text-charcoal-900 mb-3">Tudo pronto! 🌱</h1>
          <p className="text-charcoal-500 mb-8 leading-relaxed">
            Seu perfil está completo. Seu coach já pode ver suas informações e vocês estão prontos para começar.
          </p>
          <button
            onClick={() => router.push('/coachee/dashboard')}
            className="w-full bg-sage-500 hover:bg-sage-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Ir para o dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-semibold text-charcoal-800">CoachSync</span>
          <span className="text-charcoal-300 text-sm ml-2">— Boas-vindas ao seu processo</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <StepIndicator current={step} steps={STEPS} />

        {/* ── STEP 1: PROFILE ── */}
        {step === 'profile' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-display text-2xl font-bold text-charcoal-900 mb-1">Vamos nos conhecer</h1>
            <p className="text-charcoal-500 text-sm mb-8">Preencha seus dados para que seu coach possa te acompanhar melhor.</p>

            <div className="bg-white border border-cream-200 rounded-2xl p-6 space-y-5">
              <div>
                <label className="label">Nome completo *</label>
                <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Telefone</label>
                  <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="label">CPF</label>
                  <input type="text" className="input" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>
              <div>
                <label className="label">Conte um pouco sobre você</label>
                <textarea
                  className="input resize-none min-h-24"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Profissão, contexto atual, o que te traz até aqui..."
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!fullName.trim()) { toast.error('Nome é obrigatório'); return }
                saveAndAdvance('wheel_of_life', { full_name: fullName, phone, cpf, bio })
              }}
              disabled={loading}
              className="mt-6 w-full bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── STEP 2: WHEEL OF LIFE ── */}
        {step === 'wheel_of_life' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-display text-2xl font-bold text-charcoal-900 mb-1">Roda da Vida</h1>
            <p className="text-charcoal-500 text-sm mb-8">
              Avalie de <strong>0 a 10</strong> o quanto você está satisfeito em cada área hoje.
              Seja honesto — não há resposta certa.
            </p>

            <div className="bg-white border border-cream-200 rounded-2xl p-6 space-y-6">
              {WHEEL.map(entry => (
                <WheelSlider
                  key={entry.key}
                  entry={entry}
                  value={wheel[entry.key] ?? 5}
                  onChange={v => setWheel(prev => ({ ...prev, [entry.key]: v }))}
                />
              ))}
            </div>

            {/* Visual summary */}
            <div className="mt-4 bg-sage-50 border border-sage-200 rounded-2xl p-4">
              <p className="text-xs text-sage-700 font-medium mb-3">Resumo da sua Roda</p>
              <div className="grid grid-cols-4 gap-2">
                {WHEEL.map(entry => {
                  const val = wheel[entry.key] ?? 5
                  return (
                    <div key={entry.key} className="text-center">
                      <div className="text-lg mb-0.5">{entry.emoji}</div>
                      <div className={cn('text-sm font-bold',
                        val >= 8 ? 'text-sage-600' : val >= 5 ? 'text-amber-600' : 'text-red-500'
                      )}>{val}</div>
                      <div className="text-xs text-charcoal-400 leading-tight">{entry.label.split(' ')[0]}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('profile')} className="px-5 py-3.5 border border-cream-300 rounded-xl text-sm font-medium text-charcoal-600 hover:bg-cream-100 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={() => saveAndAdvance('assessment', { wheel_of_life: wheel })}
                disabled={loading}
                className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: ASSESSMENT ── */}
        {step === 'assessment' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-display text-2xl font-bold text-charcoal-900 mb-1">Diagnóstico inicial</h1>
            <p className="text-charcoal-500 text-sm mb-8">
              Responda com liberdade. Estas informações são confidenciais e ajudarão seu coach a te conhecer melhor.
            </p>

            <div className="space-y-5">
              {ASSESSMENT_QUESTIONS.map((q, i) => (
                <div key={q.key} className="bg-white border border-cream-200 rounded-2xl p-5">
                  <label className="text-sm font-medium text-charcoal-800 mb-3 block">
                    <span className="text-sage-500 font-bold mr-2">{i + 1}.</span>{q.label}
                  </label>
                  <textarea
                    className="input resize-none min-h-20"
                    value={assessment[q.key]}
                    onChange={e => setAssessment(prev => ({ ...prev, [q.key]: e.target.value }))}
                    placeholder="Escreva à vontade..."
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('wheel_of_life')} className="px-5 py-3.5 border border-cream-300 rounded-xl text-sm font-medium text-charcoal-600 hover:bg-cream-100 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={() => saveAndAdvance('goals', { initial_assessment: assessment })}
                disabled={loading}
                className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: GOALS ── */}
        {step === 'goals' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-display text-2xl font-bold text-charcoal-900 mb-1">Seus objetivos</h1>
            <p className="text-charcoal-500 text-sm mb-8">
              O que você quer transformar neste processo? Seja específico — quanto mais claro, mais poderoso o processo.
            </p>

            <div className="bg-white border border-cream-200 rounded-2xl p-6">
              <label className="label">Quais são seus principais objetivos com o coaching?</label>
              <textarea
                className="input resize-none min-h-48"
                value={objectives}
                onChange={e => setObjectives(e.target.value)}
                placeholder={`Exemplos:\n• Conquistar uma promoção até dezembro\n• Melhorar minha comunicação com a equipe\n• Recuperar o equilíbrio entre vida pessoal e profissional\n• Iniciar meu negócio próprio`}
              />
              <p className="text-xs text-charcoal-400 mt-2">
                Dica: pense em 3-5 objetivos concretos e com prazo se possível.
              </p>
            </div>

            {/* Motivation card */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">✨ Quase lá!</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Após finalizar, seu coach poderá visualizar seu perfil completo e vocês estarão prontos para a primeira sessão.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('assessment')} className="px-5 py-3.5 border border-cream-300 rounded-xl text-sm font-medium text-charcoal-600 hover:bg-cream-100 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={finish}
                disabled={loading || !objectives.trim()}
                className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Concluir onboarding <CheckCircle2 className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
