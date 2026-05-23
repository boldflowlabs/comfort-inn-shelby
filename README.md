# 🏨 Elara — AI Virtual Concierge for Comfort Inn Shelby

> An AI-powered virtual concierge chatbot built for [Comfort Inn Shelby](https://www.comfortshelby.com), providing 24/7 guest assistance, lead capture, complaint escalation, and automated follow-ups.

---

## ✨ Features

| Feature | Description |
|---|---|
| **AI Concierge Chat** | GPT-4o-mini powered conversational assistant with hotel knowledge base |
| **Embeddable Widget** | Drop-in `<script>` tag to embed on any website |
| **Lead Capture** | Conversational step-by-step lead collection (name → email → phone → dates → room) |
| **Complaint Escalation** | Structured complaint intake with instant owner notification |
| **Admin Dashboard** | Real-time analytics, lead management, transcript viewer, KB editor |
| **n8n Automation** | Webhook integration for email alerts, follow-ups, and abandoned booking recovery |
| **Multi-language** | Automatic detection and response in English, Spanish, and Japanese |
| **Rate Limiting** | Built-in per-session rate limiting to prevent API abuse |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: SQLite via [Prisma](https://www.prisma.io/) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **AI**: [OpenAI GPT-4o-mini](https://platform.openai.com/)
- **Automation**: [n8n](https://n8n.io/) (self-hosted workflow automation)
- **Auth**: Custom JWT (HMAC-SHA256)
- **Styling**: Vanilla CSS with editorial design system

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Knowledge base seed data
│   └── migrations/            # Database migrations
├── public/
│   └── widget.js              # Embeddable chat widget script
├── src/
│   ├── app/
│   │   ├── page.tsx           # Hotel landing page
│   │   ├── chat-iframe/       # Chat widget UI (loaded in iframe)
│   │   ├── elara-admin/       # Admin dashboard
│   │   └── api/
│   │       ├── chat/          # AI chat endpoint
│   │       ├── lead/          # Lead capture endpoint
│   │       ├── complaint/     # Complaint submission endpoint
│   │       ├── event/         # Event webhook + abandonment scanner
│   │       └── admin/         # Admin API (auth, stats, CRUD)
│   └── lib/
│       ├── db.ts              # Prisma client singleton
│       └── jwt.ts             # JWT sign/verify utilities
├── .env.example               # Environment variable template
├── n8n_automation_guide.md    # n8n workflow setup guide
└── PRD.md                     # Product requirements document
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 9+
- [OpenAI API Key](https://platform.openai.com/api-keys)

### 1. Clone & Install

```bash
git clone https://github.com/boldflowlabs/comfort-inn-shelby.git
cd comfort-inn-shelby
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | SQLite file path or PostgreSQL connection string | ✅ |
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) | ✅ |
| `ADMIN_EMAIL` | Admin dashboard login email | ✅ |
| `ADMIN_PASSWORD` | Admin dashboard login password | ✅ |
| `JWT_SECRET` | Random 32+ character secret for JWT signing | ✅ |
| `N8N_WEBHOOK_URL` | n8n webhook endpoint for automations | Optional |

### 3. Initialize Database

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

| Page | URL |
|---|---|
| Landing Page | `http://localhost:3000` |
| Chat Widget (iframe) | `http://localhost:3000/chat-iframe` |
| Admin Dashboard | `http://localhost:3000/elara-admin` |

---

## 🌐 Deployment

### Vercel (Recommended for Serverless)

> ⚠️ SQLite does **not** work on Vercel. Switch `DATABASE_URL` to a cloud database (e.g., [Turso](https://turso.tech/), [Neon](https://neon.tech/), or [Supabase](https://supabase.com/)).

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy

### VPS / Self-Hosted (Recommended for SQLite)

```bash
# Build for production
npm run build

# Start production server
npm start
```

The `output: "standalone"` setting in `next.config.ts` produces a minimal deployment bundle.

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 💬 Widget Embed

Add this script tag to any website to embed the Elara chat widget:

```html
<script src="https://your-domain.com/widget.js" defer></script>
```

The widget appears as a floating concierge badge in the bottom-right corner.

---

## 🤖 n8n Automation Setup

See [`n8n_automation_guide.md`](./n8n_automation_guide.md) for detailed workflow setup instructions covering:

- **Branch A**: New lead → Email owner + auto-reply to guest
- **Branch B**: Complaint escalated → Urgent email to owner
- **Branch C**: Abandoned booking → Follow-up email to guest

---

## 🔒 Security

- All admin routes require JWT authentication
- Passwords are never stored — compared against env vars
- Security headers (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Rate limiting on chat API (30 req/min per session)
- `X-Powered-By` header disabled
- HttpOnly, Secure, SameSite cookies for admin auth

---

## 📄 License

Private — Comfort Inn Shelby / BoldFlow Labs. All rights reserved.
