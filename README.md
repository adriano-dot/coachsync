# CoachSync 🌱

Plataforma SaaS multi-tenant para coaches gerenciarem sessões, acompanharem a evolução dos coachees e potencializarem resultados com IA.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Next.js API Routes |
| Banco de dados | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| IA | Claude API (Anthropic) |
| Email | Resend |
| Deploy | Vercel |

---

## Funcionalidades do MVP

### Coach/Admin
- ✅ Login seguro
- ✅ Dashboard com métricas gerais
- ✅ Cadastro e gestão de coachees
- ✅ Perfil completo do coachee (dados pessoais, objetivos, Roda da Vida)
- ✅ Registro de sessões
- ✅ Upload de transcrição (TXT, PDF) ou áudio (MP3, WAV, M4A)
- ✅ **Resumo automático com IA** (visão geral, tópicos, tom emocional, compromissos, tarefas)
- ✅ Criação automática de tarefas a partir do resumo
- ✅ Ferramentas sugeridas para próxima sessão
- ✅ Upload de materiais e metodologias para a base da IA
- ✅ Biblioteca de recursos (livros, filmes, artigos, podcasts)
- ✅ Configurações do perfil do coach

### Coachee
- ✅ Login individual
- ✅ Dashboard personalizado
- ✅ Histórico de sessões com resumos IA
- ✅ Gerenciamento de tarefas (atualização de status)
- ✅ Biblioteca de recursos do coach
- ✅ **IA Assistente pessoal** (chat contextualizado com histórico)
- ✅ Edição de perfil + Roda da Vida

### Segurança
- ✅ Row Level Security (RLS) no Supabase
- ✅ Separação total de dados entre tenants
- ✅ Coachee acessa apenas seus próprios dados
- ✅ Middleware de proteção de rotas com base em role

---

## Setup Local

### 1. Clone e instale dependências

```bash
git clone <seu-repositorio>
cd coachsync
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor, execute o arquivo `supabase/migrations/001_schema.sql`
3. Em Storage, crie 3 buckets públicos:
   - `audio`
   - `transcripts`
   - `materials`

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
ANTHROPIC_API_KEY=sua_chave_anthropic
```

**Onde encontrar as chaves Supabase:**
- Vá em Settings → API no painel do Supabase
- `anon key` = chave pública (ANON)
- `service_role key` = chave privada (nunca exponha no frontend)

**Chave Anthropic:**
- Acesse [console.anthropic.com](https://console.anthropic.com)
- API Keys → Create Key

### 4. Rode localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## Fluxo de uso

### Como Coach:
1. Acesse `/auth/register` e crie uma conta como **Coach**
2. Faça login → vai para `/dashboard`
3. Vá em **Coachees** → Cadastre seu primeiro coachee
4. Vá em **Sessões** → Nova Sessão
5. Selecione o coachee, preencha os dados e cole/envie a transcrição
6. Clique em **Salvar e analisar com IA**
7. O sistema gera resumo + tarefas automaticamente

### Como Coachee:
1. Use as credenciais enviadas pelo coach para fazer login
2. Acesse `/coachee/dashboard`
3. Veja suas sessões, tarefas e a IA assistente

---

## Deploy na Vercel

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel

# Configure as variáveis de ambiente no painel da Vercel:
# Settings → Environment Variables
```

Adicione todas as variáveis do `.env.local` nas configurações do projeto na Vercel.

---

## Supabase Storage — Buckets necessários

No painel do Supabase, vá em Storage e crie os seguintes buckets:

| Bucket | Tipo | Para |
|---|---|---|
| `audio` | Público | Gravações de sessão |
| `transcripts` | Público | Arquivos de transcrição |
| `materials` | Público | Materiais do coach |

---

## Estrutura de Pastas

```
coachsync/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/          # Tela de login
│   │   │   └── register/       # Tela de cadastro
│   │   ├── dashboard/          # Área do Coach
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── layout.tsx      # Sidebar do coach
│   │   │   ├── coachees/       # Gestão de coachees
│   │   │   ├── sessions/       # Sessões
│   │   │   ├── materials/      # Upload de materiais
│   │   │   ├── library/        # Biblioteca
│   │   │   └── settings/       # Configurações
│   │   ├── coachee/            # Área do Coachee
│   │   │   ├── dashboard/      # Dashboard do coachee
│   │   │   ├── sessions/       # Histórico de sessões
│   │   │   ├── tasks/          # Tarefas
│   │   │   ├── library/        # Biblioteca
│   │   │   ├── chat/           # IA Assistente
│   │   │   └── profile/        # Perfil
│   │   └── api/
│   │       ├── coachees/create/    # Criar coachee (admin)
│   │       ├── sessions/summarize/ # Gerar resumo com IA
│   │       └── coachee/chat/       # Chat com IA
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Cliente browser
│   │   │   └── server.ts       # Cliente server
│   │   ├── prompts.ts          # Prompts da IA
│   │   └── utils.ts            # Utilitários
│   ├── middleware.ts            # Proteção de rotas
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── supabase/
│   └── migrations/
│       └── 001_schema.sql      # Schema completo
├── .env.example
├── package.json
└── tailwind.config.ts
```

---

## API Routes

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/coachees/create` | POST | Cria usuário coachee (usa service role) |
| `/api/sessions/summarize` | POST | Gera resumo IA da transcrição |
| `/api/coachee/chat` | POST | Chat com IA assistente do coachee |

---

## Rodando com Claude Code

```bash
# Na raiz do projeto
claude

# Comandos úteis dentro do Claude Code:
# "adicione autenticação com Google"
# "crie a página de onboarding do coachee"
# "adicione Whisper para transcrição automática de áudio"
# "implemente notificações por email com Resend"
```

---

## V2 — Funcionalidades futuras

- [ ] Transcrição automática de áudio com Whisper API
- [ ] Sala de vídeo própria (Daily.co ou Jitsi)
- [ ] IA em tempo real durante sessão (overlay para o coach)
- [ ] Notificações via WhatsApp (Evolution API / Twilio)
- [ ] Notificações via Telegram Bot
- [ ] Análise de tom de voz via transcrição avançada
- [ ] Onboarding guiado do coachee (multi-step)
- [ ] DISC / Perfil comportamental interativo
- [ ] Painel financeiro (pagamentos, renovações)
- [ ] App mobile (React Native / Expo)
- [ ] Exportar relatório de evolução em PDF
- [ ] Integração com Google Calendar

---

## Troubleshooting

**Erro de autenticação:**
Verifique se o `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos no `.env.local`

**Erro ao criar coachee:**
Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está configurado. Ele é necessário para criar usuários via admin API.

**IA não gera resumo:**
Verifique se `ANTHROPIC_API_KEY` está configurado e tem créditos disponíveis.

**Upload não funciona:**
Certifique-se que os buckets `audio`, `transcripts` e `materials` existem no Supabase Storage.
