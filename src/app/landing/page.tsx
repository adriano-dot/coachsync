'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Leaf, ArrowRight, Sparkles, Brain, Users, CalendarDays,
  CheckSquare, BarChart3, Shield, Zap, ChevronDown,
  MessageCircle, Star, Check, Minus, Play, Clock,
  TrendingUp, BookOpen, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Reveal on scroll ──────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Animated hero mockup ──────────────────────────────────────────
function HeroMockup() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 2200)
    return () => clearInterval(t)
  }, [])

  const insights = [
    { label: 'Abertura', value: 78, color: 'bg-violet-500' },
    { label: 'Motivação', value: 65, color: 'bg-sage-500' },
    { label: 'Resistência', value: 22, color: 'bg-amber-400' },
  ]

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-sage-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative bg-white border border-cream-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-charcoal-900 px-5 py-4 flex items-center gap-3">
          <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-white font-semibold text-sm">CoachSync</span>
          <div className="ml-auto flex items-center gap-1.5 bg-green-500/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Sessão ao vivo</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Timer */}
          <div className="flex items-center justify-between text-xs text-charcoal-400">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 00:34:12</span>
            <span className="font-medium text-charcoal-700">Maria Fernanda</span>
          </div>

          {/* Transcript preview */}
          <div className="space-y-2">
            {[
              { speaker: 'Coach', text: 'O que te impede de dar esse próximo passo?', color: 'border-sage-400' },
              { speaker: 'Coachee', text: 'Acho que é o medo de errar na frente da equipe...', color: 'border-violet-400' },
            ].map((l, i) => (
              <div
                key={i}
                className={cn('text-xs px-3 py-2 rounded-lg border-l-2 bg-cream-50 text-charcoal-700 transition-all duration-500', l.color)}
                style={{ opacity: step >= i ? 1 : 0.3 }}
              >
                <span className="font-semibold text-charcoal-500">{l.speaker}: </span>{l.text}
              </div>
            ))}
          </div>

          {/* AI insights */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-violet-700 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> IA em tempo real
            </p>
            <div className="space-y-2">
              {insights.map(ins => (
                <div key={ins.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-charcoal-500">{ins.label}</span>
                    <span className="font-semibold text-charcoal-700">{ins.value}%</span>
                  </div>
                  <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000', ins.color)}
                      style={{ width: step >= 2 ? `${ins.value}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested question */}
          {step >= 3 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs font-semibold text-amber-700 mb-1">💡 Pergunta sugerida</p>
              <p className="text-xs text-amber-800">"Se não houvesse julgamento, o que você faria diferente?"</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 -right-3 bg-sage-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
        IA ativa
      </div>
      <div className="absolute -bottom-3 -left-3 bg-white border border-cream-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-sage-500" />
        <span className="text-xs font-medium text-charcoal-700">3 tarefas geradas</span>
      </div>
    </div>
  )
}

// ── Nav ───────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = ['Como funciona', 'Funcionalidades', 'Preços', 'FAQ']

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-xl border-cream-200 shadow-sm' : 'bg-white/80 backdrop-blur-md border-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sage-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-semibold text-charcoal-800 text-lg">CoachSync</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              className="text-sm text-charcoal-500 hover:text-charcoal-800 transition-colors">{l}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden md:block text-sm text-charcoal-500 hover:text-charcoal-700 transition-colors">
            Entrar
          </Link>
          <Link href="/auth/register"
            className="bg-sage-500 hover:bg-sage-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Começar grátis
          </Link>
          <button onClick={() => setOpen(o => !o)} className="md:hidden text-charcoal-500 p-1">
            <ChevronDown className={cn('w-5 h-5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-cream-100 bg-white px-5 py-4 space-y-3">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              onClick={() => setOpen(false)}
              className="block text-sm text-charcoal-600">{l}</a>
          ))}
          <Link href="/auth/login" className="block text-sm text-charcoal-600">Entrar</Link>
        </div>
      )}
    </header>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn('border rounded-xl overflow-hidden transition-colors', open ? 'border-sage-300' : 'border-cream-200')}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream-50 transition-colors">
        <span className="text-sm font-medium text-charcoal-800 pr-4">{q}</span>
        <ChevronDown className={cn('w-4 h-4 text-charcoal-400 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="px-5 pb-4">
          <p className="text-sm text-charcoal-500 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

// ── Pricing card ──────────────────────────────────────────────────
function PricingCard({ name, price, period, desc, features, cta, highlight, badge }: {
  name: string; price: string; period: string; desc: string
  features: { text: string; included: boolean }[]
  cta: string; highlight?: boolean; badge?: string
}) {
  return (
    <div className={cn(
      'relative rounded-2xl border p-6 flex flex-col gap-5 transition-transform duration-200 hover:-translate-y-1',
      highlight ? 'border-sage-400 bg-sage-50' : 'border-cream-200 bg-white'
    )}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-charcoal-500 mb-2">{name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-charcoal-800 font-display">{price}</span>
          {period && <span className="text-sm text-charcoal-400">{period}</span>}
        </div>
        <p className="text-sm text-charcoal-500 mt-2">{desc}</p>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map(f => (
          <li key={f.text} className="flex items-start gap-2.5">
            {f.included
              ? <Check className="w-4 h-4 text-sage-500 flex-shrink-0 mt-0.5" />
              : <Minus className="w-4 h-4 text-cream-400 flex-shrink-0 mt-0.5" />}
            <span className={cn('text-sm', f.included ? 'text-charcoal-700' : 'text-charcoal-300')}>{f.text}</span>
          </li>
        ))}
      </ul>
      <Link href="/auth/register" className={cn(
        'w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors',
        highlight
          ? 'bg-sage-500 hover:bg-sage-600 text-white'
          : 'border border-cream-300 hover:border-charcoal-300 text-charcoal-700 hover:bg-cream-50'
      )}>
        {cta}
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-800">
      <Nav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-sage-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-sage-100 border border-sage-200 rounded-full px-3.5 py-1.5 text-xs text-sage-700 font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                IA para coaches profissionais
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.2rem] font-display font-bold text-charcoal-900 leading-[1.1] mb-5">
                Sessões mais{' '}
                <span className="text-sage-600">profundas.</span>{' '}
                Resultados mais{' '}
                <span className="text-sage-600">rápidos.</span>
              </h1>
              <p className="text-lg text-charcoal-500 leading-relaxed mb-8 max-w-lg">
                CoachSync usa IA para transcrever sessões, gerar insights em tempo real,
                criar tarefas automaticamente e acompanhar a evolução de cada coachee.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 bg-sage-500 hover:bg-sage-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:scale-[1.02] text-sm shadow-lg shadow-sage-500/25">
                  Começar grátis por 30 dias <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 border border-cream-300 hover:border-charcoal-300 hover:bg-cream-100 text-charcoal-600 font-medium px-6 py-3.5 rounded-xl transition-colors text-sm">
                  <Play className="w-4 h-4" /> Ver como funciona
                </a>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Shield, label: 'Dados seguros' },
                  { icon: Zap, label: 'Setup em 5 min' },
                  { icon: Brain, label: 'Claude AI' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-1.5 text-xs text-charcoal-400 bg-cream-100 border border-cream-200 rounded-full px-3 py-1.5">
                    <b.icon className="w-3 h-3" />{b.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ── */}
      <Reveal>
        <section className="border-y border-cream-200 py-8 bg-cream-50">
          <div className="max-w-6xl mx-auto px-5">
            <p className="text-center text-xs text-charcoal-300 uppercase tracking-widest mb-6">
              Coaches que confiam no CoachSync
            </p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 opacity-40">
              {['Instituto Crescer', 'Coach & You', 'Viva Consciente', 'Líder 360', 'Método Âncora', 'Evolve Pro'].map(n => (
                <span key={n} className="text-sm font-bold text-charcoal-600 tracking-wide">{n}</span>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal-900 mb-3">Como funciona</h2>
            <p className="text-charcoal-500 text-lg">Do início da sessão ao relatório — tudo automatizado.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: CalendarDays, color: 'text-sage-600 bg-sage-100', title: 'Inicie a sessão', desc: 'Selecione o coachee, escolha "ao vivo" e a IA começa a transcrever automaticamente via Web Speech API.' },
              { step: '02', icon: Brain, color: 'text-violet-600 bg-violet-100', title: 'IA analisa em tempo real', desc: 'A cada 30 segundos, receba insights sobre o tom emocional, temas emergentes, comprometimentos e perguntas poderosas sugeridas.' },
              { step: '03', icon: Sparkles, color: 'text-amber-600 bg-amber-100', title: 'Resumo e tarefas automáticos', desc: 'Ao encerrar, a IA gera o resumo completo, lista de tarefas e foco para a próxima sessão — tudo salvo no perfil do coachee.' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 120}>
                <div>
                  <div className="text-5xl font-black text-cream-200 mb-3 font-display">{item.step}</div>
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-charcoal-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-charcoal-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="py-20 border-t border-cream-200 bg-cream-50">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="text-center mb-12">
            <div className="flex justify-center gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-charcoal-900 mb-2">O que coaches dizem</h2>
            <p className="text-charcoal-400 text-sm">+4h economizadas por semana, em média</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Ana Beatriz', role: 'Executive Coach', text: 'Antes eu passava horas escrevendo o resumo pós-sessão. Agora a IA faz isso em segundos, e é muito mais completo do que eu escreveria.' },
              { name: 'Ricardo Souza', role: 'Life Coach', text: 'O painel de insights em tempo real mudou completamente minha forma de conduzir sessões. Percebo padrões que antes eu perderia.' },
              { name: 'Camila Torres', role: 'Coach de Liderança', text: 'Meus coachees adoram ter acesso ao histórico e às tarefas no portal deles. A sensação de acompanhamento é muito maior.' },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="bg-white border border-cream-200 rounded-2xl p-5 h-full hover:border-sage-300 transition-colors">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-charcoal-600 leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-sage-700">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-charcoal-800">{t.name}</p>
                      <p className="text-xs text-charcoal-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-20 md:py-28 border-t border-cream-200 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal-900 mb-3">Tudo que você precisa</h2>
            <p className="text-charcoal-500">Para coaches solo ou equipes de coaching.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[
              { icon: Brain, color: 'text-violet-600 bg-violet-100', title: 'IA em tempo real', desc: 'Análise de tom emocional, temas, comprometimentos e perguntas sugeridas durante a sessão.' },
              { icon: MessageCircle, color: 'text-sage-600 bg-sage-100', title: 'Transcrição automática', desc: 'Web Speech API transcreve a conversa em português sem precisar de nenhuma integração externa.' },
              { icon: Sparkles, color: 'text-amber-600 bg-amber-100', title: 'Resumo com IA', desc: 'Ao encerrar, Claude gera visão geral, avanços, comprometimentos, tarefas e próximos passos.' },
              { icon: Users, color: 'text-blue-600 bg-blue-100', title: 'Portal do coachee', desc: 'Cada coachee tem seu próprio acesso: histórico de sessões, tarefas, biblioteca e IA assistente.' },
              { icon: TrendingUp, color: 'text-rose-600 bg-rose-100', title: 'Roda da Vida', desc: 'Visualize e acompanhe a evolução nas 8 dimensões da vida do coachee ao longo do processo.' },
              { icon: BookOpen, color: 'text-indigo-600 bg-indigo-100', title: 'Biblioteca de recursos', desc: 'Compartilhe livros, artigos, exercícios e ferramentas diretamente com seus coachees.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="p-5 rounded-2xl border border-cream-200 bg-cream-50 hover:border-sage-300 transition-colors h-full">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', f.color)}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-semibold text-charcoal-800 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-charcoal-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Coachee AI highlight */}
          <Reveal>
            <div className="rounded-3xl border border-sage-200 bg-sage-50 p-8 md:p-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-sage-100 border border-sage-200 rounded-full px-3 py-1.5 text-xs text-sage-700 font-medium mb-4">
                    <Brain className="w-3.5 h-3.5" /> IA do Coachee
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-charcoal-900 mb-3">
                    Acompanhamento entre sessões
                  </h3>
                  <p className="text-charcoal-600 leading-relaxed mb-5">
                    Cada coachee tem uma IA pessoal que conhece seu histórico, objetivos e tarefas.
                    Suporte contínuo, sem substituir o coach.
                  </p>
                  <ul className="space-y-2">
                    {['"Como estou indo com minhas tarefas?"', '"Me ajuda a refletir sobre minha semana."', '"Quais foram meus compromissos da última sessão?"'].map(q => (
                      <li key={q} className="flex items-center gap-2 text-sm text-charcoal-600">
                        <Target className="w-4 h-4 text-sage-500 flex-shrink-0" />{q}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-cream-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-cream-100">
                    <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center">
                      <Leaf className="w-3.5 h-3.5 text-sage-600" />
                    </div>
                    <span className="text-sm font-medium text-charcoal-800">IA Assistente</span>
                    <span className="ml-auto text-xs text-sage-500">● online</span>
                  </div>
                  {[
                    { user: true, msg: 'Quais são minhas tarefas da semana?' },
                    { user: false, msg: 'Você tem 3 tarefas pendentes: 1) Praticar feedback assertivo com a equipe, 2) Escrever sua lista de valores pessoais, 3) 10 min de reflexão diária. Quer que eu te ajude com alguma delas?' },
                  ].map((m, i) => (
                    <div key={i} className={cn('flex', m.user ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                        m.user ? 'bg-sage-500 text-white rounded-tr-sm' : 'bg-cream-100 text-charcoal-700 rounded-tl-sm'
                      )}>
                        {m.msg}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="preços" className="py-20 md:py-28 border-t border-cream-200 bg-cream-50">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal-900 mb-3">Planos simples</h2>
            <p className="text-charcoal-500">30 dias grátis. Sem cartão no início.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Solo', price: 'Grátis', period: '', desc: 'Para coaches iniciando.', badge: undefined, highlight: false, cta: 'Começar grátis',
                features: [{ text: 'Até 3 coachees', included: true }, { text: 'Sessões ilimitadas', included: true }, { text: 'Resumo com IA', included: true }, { text: 'Portal do coachee', included: true }, { text: 'Sessão ao vivo com IA', included: false }, { text: 'Materiais e biblioteca', included: false }] },
              { name: 'Pro', price: 'R$ 79', period: '/mês', desc: 'Para coaches estabelecidos.', badge: 'Mais popular', highlight: true, cta: 'Testar 30 dias grátis',
                features: [{ text: 'Coachees ilimitados', included: true }, { text: 'Sessão ao vivo com IA', included: true }, { text: 'Insights em tempo real', included: true }, { text: 'Materiais e biblioteca', included: true }, { text: 'IA assistente do coachee', included: true }, { text: 'Exportar relatórios PDF', included: true }] },
              { name: 'Equipe', price: 'R$ 199', period: '/mês', desc: 'Para múltiplos coaches.', badge: undefined, highlight: false, cta: 'Falar com a gente',
                features: [{ text: 'Tudo do Pro', included: true }, { text: 'Até 5 coaches', included: true }, { text: 'Painel administrativo', included: true }, { text: 'Relatórios consolidados', included: true }, { text: 'Onboarding dedicado', included: true }, { text: 'Suporte prioritário', included: true }] },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <PricingCard {...plan} />
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-center text-xs text-charcoal-400 mt-6">
              ✅ 30 dias grátis · Sem cartão no início · Cancele quando quiser
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 md:py-28 border-t border-cream-200 bg-white">
        <div className="max-w-2xl mx-auto px-5">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal-900 mb-3">Dúvidas frequentes</h2>
          </Reveal>
          <div className="space-y-2">
            {[
              { q: 'Como funciona a transcrição automática?', a: 'Usamos a Web Speech API nativa do Chrome/Edge para transcrever a sessão em português diretamente no seu navegador, sem enviar áudio para servidores externos.' },
              { q: 'A IA substitui o trabalho do coach?', a: 'Não. A IA é uma ferramenta de apoio: transcreve, analisa padrões e sugere perguntas, mas todas as decisões e a condução da sessão são do coach.' },
              { q: 'Os dados do meu coachee ficam seguros?', a: 'Sim. Usamos Supabase com Row Level Security — cada coach acessa apenas seus próprios dados e coachees. Conformidade com LGPD.' },
              { q: 'Preciso de algum hardware especial?', a: 'Não. Basta um computador com Chrome ou Edge e microfone. A sessão ao vivo funciona 100% no navegador.' },
              { q: 'O coachee precisa criar uma conta?', a: 'Sim. O coach cadastra o coachee e ele recebe as credenciais por e-mail. O portal é simples e feito para não-técnicos.' },
              { q: 'Posso usar sem a funcionalidade de sessão ao vivo?', a: 'Sim. Você pode registrar sessões passadas colando a transcrição e a IA gera o resumo normalmente.' },
            ].map((faq, i) => (
              <Reveal key={faq.q} delay={i * 50}>
                <FAQItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 md:py-28 border-t border-cream-200 bg-sage-50">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-sage-100 border border-sage-200 rounded-full px-3.5 py-1.5 text-xs text-sage-700 font-medium mb-6">
              <BarChart3 className="w-3.5 h-3.5" />
              Coaches geram 3x mais insights com IA
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-charcoal-900 mb-5 leading-tight">
              Eleve seu coaching.{' '}
              <span className="text-sage-600">Comece hoje.</span>
            </h2>
            <p className="text-charcoal-500 mb-10 text-lg">
              30 dias grátis. Sem cartão. Setup em 5 minutos.
            </p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 bg-sage-500 hover:bg-sage-600 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] text-base shadow-lg shadow-sage-500/25">
              Criar conta gratuita <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-charcoal-400">
              {['✅ 30 dias grátis', '✅ Sem cartão no início', '✅ Cancele quando quiser', '✅ LGPD Compliant'].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-cream-200 py-10 bg-white">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sage-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-semibold text-charcoal-800">CoachSync</span>
          </div>
          <p className="text-xs text-charcoal-400 order-last md:order-none">© 2026 CoachSync. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-xs text-charcoal-400">
            <Link href="/auth/login" className="hover:text-charcoal-700 transition-colors">Entrar</Link>
            <Link href="/auth/register" className="text-sage-600 hover:text-sage-700 font-medium transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
