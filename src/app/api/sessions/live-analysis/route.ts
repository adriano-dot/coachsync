import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const LIVE_ANALYSIS_PROMPT = (transcript: string, coacheeName: string, elapsedSeconds: number) => `
Você é um assistente especializado em coaching. Analise a transcrição PARCIAL de uma sessão ao vivo e retorne insights em tempo real para o coach.

COACHEE: ${coacheeName}
TEMPO DECORRIDO: ${Math.floor(elapsedSeconds / 60)} minutos
TRANSCRIÇÃO PARCIAL:
${transcript}

Responda APENAS com JSON válido neste formato exato:
{
  "emotions": {
    "abertura": <0-100>,
    "ansiedade": <0-100>,
    "motivacao": <0-100>,
    "resistencia": <0-100>
  },
  "themes": [
    "tema identificado 1",
    "tema identificado 2"
  ],
  "commitments": [
    "frase exata de comprometimento detectada <em>(tempo)</em>"
  ],
  "cautions": [
    "alerta importante para o coach agir agora"
  ],
  "suggestedQuestions": [
    "pergunta poderosa contextual 1",
    "pergunta poderosa contextual 2"
  ]
}

Regras:
- Emotions: baseie-se no tom, escolha de palavras, pausas indicadas, hesitações
- Themes: apenas temas que emergiram NESTA conversa, não genéricos
- Commitments: apenas frases onde o coachee explicitamente se comprometeu com algo
- Cautions: padrões preocupantes (autocrítica excessiva, generalização, resistência, evasão)
- Questions: perguntas poderosas que o coach pode usar AGORA para aprofundar
- Se pouca transcrição, retorne arrays vazios exceto emotions com valores moderados
- Responda SOMENTE o JSON, sem texto adicional
`

export async function POST(req: NextRequest) {
  try {
    const { transcript, coachee_name, elapsed_seconds } = await req.json()

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json({
        insights: {
          emotions: { abertura: 50, ansiedade: 30, motivacao: 50, resistencia: 20 },
          themes: [],
          commitments: [],
          cautions: [],
          suggestedQuestions: [
            'Como você está chegando pra essa sessão hoje?',
            'O que está mais presente pra você agora?',
          ],
        }
      })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: LIVE_ANALYSIS_PROMPT(transcript, coachee_name, elapsed_seconds),
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const cleanText = content.text.replace(/```json\n?|```/g, '').trim()
    const insights = JSON.parse(cleanText)

    return NextResponse.json({ insights })
  } catch (err: any) {
    console.error('Live analysis error:', err)
    // Return safe fallback on error
    return NextResponse.json({
      insights: {
        emotions: { abertura: 60, ansiedade: 40, motivacao: 65, resistencia: 25 },
        themes: [],
        commitments: [],
        cautions: [],
        suggestedQuestions: [],
      }
    })
  }
}
