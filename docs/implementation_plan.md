# Sistema de Comunicação Multi-Canal

## Visão Geral

Um sistema que recebe notificações externas via **webhook** e as distribui automaticamente para os destinatários pelos canais corretos (Email, SMS, WhatsApp, Push). Toda mensagem é salva no banco, com status rastreável, e você pode usar **templates** para automatizar respostas sem escrever manualmente.

---

## Arquitetura Geral

```
Fonte externa (outro sistema, CRM, etc.)
        │
        ▼ POST /api/webhook
┌───────────────────────────────┐
│        Next.js (API Route)    │
│  - Valida o payload           │
│  - Salva mensagem no banco    │
│  - Chama messageDispatcher    │
└──────────────┬────────────────┘
               │
        ┌──────▼──────┐
        │ Dispatcher  │  ← decide o canal pelo messageType
        └──┬──┬──┬────┘
           │  │  │
   ┌───────┘  │  └───────┐
   ▼          ▼          ▼
sendEmail  sendSms   sendWhatsapp
(SendGrid) (Twilio)  (Twilio WA)
           │
   ┌───────▼────────┐
   │  PostgreSQL     │
   │  (via Prisma)   │
   └────────────────┘
           │
   ┌───────▼────────┐
   │  Next.js UI    │
   │  (tRPC + TW)   │
   └────────────────┘
```

---

## Fases de Implementação

### 🟢 FASE 1 — MVP: Webhook + Banco + Email
### 🟡 FASE 2 — SMS e WhatsApp com Twilio  
### 🔵 FASE 3 — Templates de resposta automática
### 🟣 FASE 4 — Interface gráfica (listagem + cadastro de templates)
### ⚪ FASE 5 — Push Notifications + Deploy + Segurança

---

## Contas e Serviços Necessários

### Ordem recomendada de criação

| # | Serviço | Grátis? | Link | Para quê |
|---|---------|---------|------|---------|
| 1 | **Neon** (PostgreSQL) | ✅ Sim | neon.tech | Banco de dados na nuvem |
| 2 | **SendGrid** | ✅ 100/dia | sendgrid.com | Envio de emails |
| 3 | **Twilio** | ✅ Trial | twilio.com | SMS e WhatsApp |
| 4 | **Vercel** | ✅ Sim | vercel.com | Deploy do Next.js |
| 5 | **ngrok** | ✅ Sim | ngrok.com | Testar webhooks localmente |

> [!IMPORTANT]
> Crie as contas nessa ordem. Você vai precisar das chaves (API keys) antes de começar a codar — principalmente do banco de dados (step 1) e do SendGrid (step 2), pois fazem parte do MVP.

---

## Variáveis de Ambiente (.env)

```env
# Banco de Dados (Neon, Supabase ou local)
DATABASE_URL="postgresql://user:password@host:5432/comunicacao"

# SendGrid
SENDGRID_API_KEY="SG.xxxx"
SENDGRID_FROM_EMAIL="noreply@seudominio.com"

# Twilio
TWILIO_ACCOUNT_SID="ACxxxx"
TWILIO_AUTH_TOKEN="xxxx"
TWILIO_PHONE_NUMBER="+15005550006"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Segurança do Webhook
WEBHOOK_SECRET="um-segredo-forte-aqui"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> [!CAUTION]
> **Nunca** commite o `.env` no Git. Já adicione `.env` no `.gitignore` antes do primeiro commit.

---

## Estrutura de Pastas

```
sistema-de-comunicacao/
├── prisma/
│   └── schema.prisma              # Modelos do banco de dados
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard principal
│   │   ├── messages/
│   │   │   └── page.tsx           # Lista de mensagens
│   │   ├── templates/
│   │   │   └── page.tsx           # Cadastro de templates
│   │   └── api/
│   │       ├── webhook/
│   │       │   └── route.ts       # Endpoint que recebe webhooks externos
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts   # Roteador tRPC
│   ├── server/
│   │   ├── db.ts                  # Cliente Prisma singleton
│   │   ├── trpc.ts                # Configuração tRPC
│   │   ├── routers/
│   │   │   ├── _app.ts            # Router raiz
│   │   │   ├── messages.ts        # Rotas de mensagens
│   │   │   └── templates.ts       # Rotas de templates
│   │   └── services/
│   │       ├── messageDispatcher.ts   # Decide o canal de envio
│   │       ├── sendEmail.ts           # SendGrid
│   │       ├── sendSms.ts             # Twilio SMS
│   │       ├── sendWhatsapp.ts        # Twilio WhatsApp
│   │       └── sendPush.ts            # Push (futuramente)
│   ├── lib/
│   │   ├── templateEngine.ts      # Substitui {{variáveis}} no template
│   │   └── webhookValidator.ts    # Valida assinatura do webhook
│   ├── components/
│   │   ├── MessageTable.tsx       # Tabela de mensagens
│   │   ├── TemplateForm.tsx       # Formulário de template
│   │   └── StatusBadge.tsx        # Badge de status da mensagem
│   └── types/
│       └── index.ts               # Tipos compartilhados
├── .env                           # Variáveis locais (não commitar!)
├── .env.example                   # Exemplo para documentar as vars
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Schema Prisma (Fase 1)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum MessageType {
  EMAIL
  SMS
  WHATSAPP
  PUSH
}

enum MessageStatus {
  PENDING
  SENT
  FAILED
}

model Contact {
  id        String    @id @default(cuid())
  name      String
  email     String?
  phone     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}

model Message {
  id          String        @id @default(cuid())
  from        String
  to          String
  subject     String?
  body        String
  email       String?
  phone       String?
  messageType MessageType
  status      MessageStatus @default(PENDING)
  error       String?
  sentAt      DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  contactId   String?
  contact     Contact?      @relation(fields: [contactId], references: [id])
  templateId  String?
  template    Template?     @relation(fields: [templateId], references: [id])
}

model Template {
  id          String      @id @default(cuid())
  name        String
  description String?
  messageType MessageType
  subject     String?
  body        String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  messages    Message[]
}
```

---

## Comandos de Terminal — Passo a Passo

### Etapa 1: Criar o projeto Next.js

```bash
# Na pasta sistema-de-comunicacao
npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

### Etapa 2: Instalar dependências

```bash
# ORM e banco
npm install prisma @prisma/client

# tRPC
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod

# Serviços de envio
npm install @sendgrid/mail twilio

# Utilitários
npm install superjson

# Dev
npm install -D prisma
```

### Etapa 3: Inicializar Prisma

```bash
npx prisma init
```

### Etapa 4: Aplicar schema ao banco

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Etapa 5: Rodar localmente

```bash
npm run dev
```

---

## Serviços — Implementações

### messageDispatcher.ts

Recebe uma mensagem salva no banco e chama o serviço correto baseado no `messageType`.

```typescript
// src/server/services/messageDispatcher.ts
import { MessageType } from "@prisma/client";
import { sendEmail } from "./sendEmail";
import { sendSms } from "./sendSms";
import { sendWhatsapp } from "./sendWhatsapp";
import { db } from "../db";

export async function messageDispatcher(messageId: string) {
  const message = await db.message.findUniqueOrThrow({ where: { id: messageId } });

  try {
    switch (message.messageType) {
      case MessageType.EMAIL:
        await sendEmail(message);
        break;
      case MessageType.SMS:
        await sendSms(message);
        break;
      case MessageType.WHATSAPP:
        await sendWhatsapp(message);
        break;
      default:
        throw new Error(`Canal não suportado: ${message.messageType}`);
    }

    await db.message.update({
      where: { id: messageId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (error) {
    await db.message.update({
      where: { id: messageId },
      data: { status: "FAILED", error: String(error) },
    });
    throw error;
  }
}
```

---

## Template Engine

Substitui `{{variavel}}` no corpo do template por valores reais.

```typescript
// src/lib/templateEngine.ts
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}
```

**Exemplo de uso:**
```typescript
const body = renderTemplate(
  "Olá, {{nome}}! Seu protocolo é {{protocolo}}.",
  { nome: "João", protocolo: "2024-001" }
);
// → "Olá, João! Seu protocolo é 2024-001."
```

---

## Webhook — Validação de Segurança

```typescript
// src/lib/webhookValidator.ts
import crypto from "crypto";

export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Testes Locais com ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Expor o servidor local (porta 3000)
ngrok http 3000

# Copiar a URL gerada, ex: https://abc123.ngrok.io
# Usar essa URL como webhook no seu sistema externo:
# POST https://abc123.ngrok.io/api/webhook
```

---

## Boas Práticas de Segurança

| Prática | Como aplicar |
|--------|-------------|
| Nunca expor keys no frontend | Só usar `process.env.VAR` no server-side |
| Variáveis de ambiente | `.env` local, variáveis no painel da Vercel em produção |
| Validar webhooks | Usar HMAC sha256 com `WEBHOOK_SECRET` |
| Registrar erros | Salvar `error` no campo da mensagem no banco |
| Status rastreável | Campo `status: PENDING → SENT / FAILED` |
| Rate limiting | Usar middleware `next-rate-limit` em produção |

---

## Ordem de Execução das Etapas

| # | Etapa | Fase |
|---|-------|------|
| 1 | Criar contas (Neon, SendGrid, Twilio) | Pré-requisito |
| 2 | Criar projeto Next.js e instalar deps | MVP |
| 3 | Configurar Prisma + schema + migrate | MVP |
| 4 | Criar webhook `/api/webhook/route.ts` | MVP |
| 5 | Criar `messageDispatcher` + `sendEmail` | MVP |
| 6 | Testar localmente com ngrok | MVP |
| 7 | Adicionar `sendSms` e `sendWhatsapp` (Twilio) | Fase 2 |
| 8 | Criar templates e `templateEngine` | Fase 3 |
| 9 | Criar telas de listagem e cadastro | Fase 4 |
| 10 | Deploy na Vercel | Fase 5 |

---

## Open Questions

> [!IMPORTANT]
> **Banco de dados**: Prefere usar Neon (recomendado, grátis, sem instalar nada) ou PostgreSQL local?

> [!IMPORTANT]
> **Email**: Prefere SendGrid (recomendado) ou Resend (mais moderno, também gratuito)?

> [!NOTE]
> **Twilio WhatsApp**: O sandbox do Twilio para WhatsApp exige que o destinatário envie uma mensagem opt-in primeiro. Isso é aceitável para o MVP?

> [!NOTE]
> **Push Notifications**: Web Push (browser) ou mobile (via Firebase/OneSignal)? Podemos deixar para a Fase 5.
