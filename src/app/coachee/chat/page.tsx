'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Sparkles, Bot } from 'lucide-react'
import { formatRelative } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function CoaciheeChatPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [coacheeId, setCoacheeId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCoacheeId(user.id)

      // Load chat history
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('coachee_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50)

      if (data) {
        setMessages(data.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        })))
      }
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading || !coacheeId) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/coachee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          coachee_id: coacheeId,
          history: messages.slice(-10),
        }),
      })

      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? 'Erro ao gerar resposta',
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Houve um erro. Tente novamente.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 border-b border-cream-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-charcoal-800">IA Assistente</h1>
            <p className="text-xs text-charcoal-400">Seu companheiro de jornada</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 animate-in">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-7 h-7 text-violet-400" />
            </div>
            <h2 className="font-display text-xl font-semibold text-charcoal-700 mb-2">
              Olá! Estou aqui para ajudar
            </h2>
            <p className="text-charcoal-400 text-sm max-w-sm mx-auto">
              Me fale sobre como estão indo suas tarefas, reflexões ou dúvidas sobre seu processo de coaching.
            </p>
            <div className="flex flex-col gap-2 mt-6 max-w-xs mx-auto">
              {[
                'Como estou progredindo nas minhas metas?',
                'Me ajude a refletir sobre essa semana',
                'Quais tarefas preciso focar hoje?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-4 py-2.5 rounded-xl border border-cream-300 text-sm text-charcoal-600
                             hover:bg-cream-50 hover:border-cream-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              </div>
            )}
            <div className={`max-w-lg ${msg.role === 'user' ? 'ml-auto' : ''}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sage-600 text-white rounded-tr-sm'
                  : 'bg-white border border-cream-200 text-charcoal-700 rounded-tl-sm shadow-soft'
              }`}>
                {msg.content}
              </div>
              <p className={`text-xs text-charcoal-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {formatRelative(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            </div>
            <div className="bg-white border border-cream-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-charcoal-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-8 py-4 border-t border-cream-200 bg-white">
        <div className="flex gap-3 max-w-3xl">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            rows={1}
            className="input flex-1 resize-none min-h-[44px] max-h-32"
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 flex-shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-charcoal-400 mt-2">
          Esta IA conhece seu histórico de sessões e tarefas com seu coach.
        </p>
      </div>
    </div>
  )
}
