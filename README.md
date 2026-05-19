# 🎯 AlphaSight AI

<div align="center">
  <img src="./logos/final_logo.svg" alt="AlphaSight Logo" width="100" />
  
  ### AI-Powered Market Intelligence Workspace
  
  **Real-time portfolio insights · AI-driven analysis · Seamless streaming chat**

  [![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white&style=flat-square)](https://nextjs.org)
  [![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white&style=flat-square)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
  [![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com)
  [![Mistral AI](https://img.shields.io/badge/AI-Mistral-F97316?style=flat-square)](https://mistral.ai)
  
  [![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
  [![GitHub Stars](https://img.shields.io/github/stars/Eshwar02/bearbot?style=flat-square)](https://github.com/Eshwar02/bearbot)

</div>

---

## ✨ Core Capabilities

| Feature | Description |
|---------|-------------|
| **⚡ Low-Latency Chat** | Streaming responses with real-time market context & source transparency |
| **📊 Smart Portfolio** | Live P&L tracking, health scores, sentiment analysis & buy/hold/sell signals |
| **📈 Market Intelligence** | Real-time quotes, technical analysis, fundamentals & synthesized news |
| **👁️ AI Transparency** | Execution phases, source tracking, deduplication & live activity monitor |
| **📋 Daily Briefs** | Automated portfolio summaries & market pulse reports (Vercel Cron) |
| **🔒 Enterprise Security** | RLS-enforced Supabase auth, environment-isolated credentials |
| **🎯 Multi-Turn Intelligence** | Coreference resolution for "that/it" queries, follow-up grounding |
| **📱 Responsive UI** | Mobile-first design with Tailwind CSS, Framer Motion, native OS body fonts, and Fraunces headings |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js + React 19)               │
├─────────────────────────────────────────────────────────────┤
│  • Chat UI (streaming responses)                              │
│  • Portfolio Dashboard (real-time P&L)                        │
│  • Watchlist Monitor (price tracking)                         │
│  • Settings & Profile Management                              │
│  • State: Zustand (persistent client state)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               API LAYER (Next.js Route Handlers)              │
├─────────────────────────────────────────────────────────────┤
│  /api/chat ......................... Streaming AI responses    │
│  /api/portfolio/* .................. Holdings management      │
│  /api/portfolio/intelligence ........ AI insights & signals   │
│  /api/watchlist .................... Price monitoring        │
│  /api/conversations/* .............. Chat history            │
│  /api/stock/* ...................... Market data            │
│  /api/daily-brief .................. Report generation      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  • Mistral AI (LLM, Embeddings)                               │
│  • Supabase (Auth, Postgres, RLS)                             │
│  • Yahoo Finance (Quotes, History, Search)                    │
│  • MarketAux & NewsData (News Synthesis)                      │
│  • Vercel Cron (Scheduled Briefs)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 App Router, React 19, TypeScript | Fast, type-safe UI with streaming support |
| **Styling** | Tailwind CSS, Framer Motion, native font stack, Fraunces serif | Premium responsive design, typography & animations |
| **State Management** | Zustand | Lightweight, persistent client state |
| **Backend** | Next.js Route Handlers | Serverless API functions |
| **Database** | Supabase (PostgreSQL) | RLS-enforced data isolation |
| **Auth** | Supabase Auth (PKCE OAuth) | Secure passwordless & email flows |
| **LLM** | Mistral (Large, Small) | Context-aware AI responses & embeddings |
| **Market Data** | Yahoo Finance API | Real-time quotes & historical data |
| **News** | MarketAux, NewsData, Yahoo RSS | Multi-source news aggregation |
| **Deployment** | Vercel | Serverless, edge-optimized hosting |

---

## 📂 Project Structure

```
alphasight-ai/
├── src/
│   ├── app/
│   │   ├── (app)/                  # Protected routes (authenticated)
│   │   │   ├── chat/[id]/         # Chat conversation page
│   │   │   ├── portfolio/         # Portfolio dashboard
│   │   │   ├── watchlist/         # Watchlist monitor
│   │   │   ├── daily-brief/       # Daily report
│   │   │   ├── settings/          # User preferences
│   │   │   └── profile/           # Profile management
│   │   ├── api/                   # Route handlers
│   │   │   ├── chat/              # AI streaming
│   │   │   ├── portfolio/         # Holdings CRUD
│   │   │   ├── conversations/     # Chat history
│   │   │   ├── watchlist/         # Monitoring
│   │   │   └── stock/             # Market data
│   │   ├── auth/                  # Auth pages (login, signup)
│   │   ├── login/                 # Login page
│   │   └── signup/                # Signup page
│   ├── components/
│   │   ├── chat/                  # Chat UI components
│   │   ├── portfolio/             # Portfolio cards
│   │   ├── common/                # Reusable UI elements
│   │   └── layout/                # Navigation & layout
│   ├── lib/
│   │   ├── ai/                    # Mistral integration & prompts
│   │   ├── stock/                 # Market data utilities
│   │   ├── supabase/              # DB helpers & RLS
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Helper functions
│   │   └── __tests__/             # Unit tests
│   ├── stores/                    # Zustand state management
│   ├── types/                     # Shared TypeScript types
│   └── middleware.ts              # Auth middleware
├── supabase/
│   └── schema.sql                 # Database schema with RLS
├── public/                        # Static assets
├── logos/                         # Brand assets
└── package.json                   # Dependencies & scripts
```

---

## 🎯 Intelligence & UX Innovations

### 1. **Context-Linked Follow-Ups**
Queries like *"tell me about ITC"* → *"tell me about that"* are resolved to standalone intent before routing, enabling natural multi-turn conversations.

### 2. **Web-Search Grounding**
Query rewrite path improves retrieval quality and reduces literal bad searches, ensuring every search is contextually relevant.

### 3. **Transparent AI Activity Monitor**
- Real-time execution phases (Searching... → Analyzing... → Finalizing...)
- Live source tracking with dedupe & domain-only filtering
- Smooth state transitions for optimal UX and clearer AI progress feedback

### 4. **No Hallucination Style**
Prompts enforce use of available search/context instead of "not in training data" responses, keeping all answers grounded in live data.

### 5. **Live Settings Application**
Theme, chart/news visibility, and notification toggles apply **instantly** to UI without page reloads, with full light-mode token support across settings, profile, portfolio, and brief screens.

### 6. **Semantic Memory System**
- Structured key/value memory for explicit facts (risk profile, preferences)
- pgvector embeddings for semantic facts ("prefers dividend stocks")
- Top-K retrieval with similarity thresholding
- Auto-extraction & deduplication on every chat turn

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** 18+ or 20+
- **npm** or **yarn**
- Supabase project (free tier available)
- Mistral API key

### 1. Clone & Install

```bash
git clone https://github.com/Eshwar02/bearbot.git
cd bearbot
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Provider (required)
MISTRAL_API_KEY=your-mistral-key

# News Providers (optional, but recommended)
MARKETAUX_API_KEY=your-marketaux-key
NEWSDATA_API_KEY=your-newsdata-key

# Optional: Scheduled report auth
CRON_SECRET=your-cron-secret
```

### 3. Database Setup

```bash
# Supabase CLI (optional but recommended)
supabase start

# Or manually: run supabase/schema.sql in your Supabase SQL editor
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up.

### 5. Production Deployment

```bash
npm run build
npm run start
```

Deploy to [Vercel](https://vercel.com):
```bash
vercel deploy
```

---

## 📚 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Optimized production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint checks with flat config |
| `npm test` | Run Jest tests (single-run) |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Coverage report |

---

## 🔌 API Reference

### Chat & Intelligence

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/chat` | `POST` | Stream AI response with market context | Required |
| `/api/conversations` | `GET`, `POST` | List or create chat conversations | Required |
| `/api/conversations/[id]` | `GET`, `DELETE` | Fetch or delete conversation | Required |
| `/api/conversations/[id]/messages` | `GET` | Paginated message history | Required |

### Portfolio Management

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/portfolio` | `GET`, `POST` | List holdings or add new position | Required |
| `/api/portfolio/[id]` | `PUT`, `DELETE` | Update or remove holding | Required |
| `/api/portfolio/intelligence` | `GET` | AI health score, sentiment, signals | Required |

### Market Data

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/stock/quote` | `GET` | Real-time stock quote | Optional |
| `/api/stock/search` | `GET` | Symbol/company search | Optional |

### Watchlist & Reports

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/watchlist` | `GET`, `POST`, `DELETE` | Manage watchlist | Required |
| `/api/daily-brief` | `GET`, `POST` | Fetch or generate daily brief | Required |

---

## 🌟 Recent Updates

### Latest Features (v1.2.0)
- ✅ **Memory Capture Improvements** - Enhanced semantic extraction & reliability
- ✅ **Chat Intelligence Refinements** - Coreference resolution, multi-turn grounding, and AI-generated chat titles
- ✅ **Typography Refresh** - Native OS body font stack with Fraunces serif headlines
- ✅ **Transparency Monitor** - Phase tracking, source deduplication, and clearer progress UI
- ✅ **Light Mode Support** - CSS variable tokens across settings, profile, portfolio, and brief screens
- ✅ **Live Settings** - Instant theme, chart, and notification toggles
- ✅ **Auth Redirects** - Canonical domain support
- ✅ **Password Reset** - Supabase forgot-password flow
- ✅ **Profile Management** - Email verification & password updates

### Recent Commits
```
15750ed - feat(ui): use native OS font stack for body, drop Geist sans webfont
340551f - fix: light mode tokens for settings, profile, error, portfolio-summary, add-holding-modal, schedule-settings
e276001 - feat(ui): swap to Fraunces serif and fix sidebar quick-access active state
0898afe - feat(chat): AI-generated chat titles with typewriter animation + new typography
37c03ef - feat: full light mode support with CSS variable tokens
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork the Repository

```bash
# Click "Fork" on GitHub
git clone https://github.com/YOUR_USERNAME/bearbot.git
cd bearbot
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow ESLint rules: `npm run lint`
- Write tests if applicable
- Keep commits atomic and descriptive

### 4. Commit & Push

```bash
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

- Describe what your PR does
- Reference any related issues
- Request review from maintainers

---

## 🔐 Security & Privacy

- **RLS Enforced**: All database queries use Row-Level Security
- **Auth Tokens**: Supabase PKCE OAuth flow, no password stored
- **API Keys**: Environment-isolated via `.env.local`
- **User Data**: Scoped to authenticated user (auth.uid())
- **No Hallucinations**: All AI responses grounded in live market data

---

## 📊 Performance & Scalability

- **Streaming Chat**: Low-latency responses with text-first UI
- **Edge Functions**: Vercel serverless scaling
- **Database**: Supabase PostgreSQL with connection pooling
- **Caching**: Optimized quote & history caching
- **Bundling**: Turbopack for 5-10x faster builds

---

## 📞 Support & Feedback

- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/Eshwar02/bearbot/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Eshwar02/bearbot/discussions)
- 📧 **Email**: support@alphasight.ai

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- **Mistral AI** - LLM & embedding provider
- **Supabase** - Database & auth backend
- **Vercel** - Deployment infrastructure
- **Next.js & React** - Core framework & library
- **Community Contributors** - All developers who contributed to this project

---

<div align="center">

### Made with ❤️ by the AlphaSight AI team

⭐ If you find this useful, please give us a star on [GitHub](https://github.com/Eshwar02/bearbot)

</div>
