# AlphaSight AI

<div align="center">
  <img src="./public/logo.svg" alt="AlphaSight Logo" width="100" />
  
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

##  Core Capabilities

| Feature | Description |
|---------|-------------|
| **Low-Latency Chat** | Streaming responses with real-time market context & source transparency     |
| **Smart Portfolio** | Live P&L tracking, health scores, sentiment analysis & buy/hold/sell signals |
| **Market Intelligence** | Real-time quotes, technical analysis, fundamentals & synthesized news    |
| **AI Transparency** | Execution phases, source tracking, deduplication & live activity monitor     |
| **Daily Briefs** | Automated portfolio summaries & market pulse reports (Vercel Cron)              |
| **Enterprise Security** | RLS-enforced Supabase auth, environment-isolated credentials             |
| **Multi-Turn Intelligence** | Coreference resolution for "that/it" queries, follow-up grounding    |
| **Responsive UI** | Mobile-first design with Tailwind CSS, Framer Motion, native OS body fonts, and Fraunces headings |

---

##  Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js + React 19)              │
├─────────────────────────────────────────────────────────────┤
│  • Chat UI (streaming responses)                            │
│  • Portfolio Dashboard (real-time P&L)                      │
│  • Watchlist Monitor (price tracking)                       │
│  • Settings & Profile Management                            │
│  • State: Zustand (persistent client state)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               API LAYER (Next.js Route Handlers)            │
├─────────────────────────────────────────────────────────────┤
│  /api/chat ......................... Streaming AI responses │
│  /api/portfolio/* .................. Holdings management    │
│  /api/portfolio/intelligence ........ AI insights & signals │
│  /api/watchlist .................... Price monitoring       │
│  /api/conversations/* .............. Chat history           │
│  /api/stock/* ...................... Market data            │
│  /api/daily-brief .................. Report generation      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  • Mistral AI + Cerebras (LLM, Embeddings, Fast Routing)     │
│  • Supabase (Auth, Postgres, RLS)                           │
│  • Yahoo Finance + Finnhub (Quotes, History, Fundamentals)  │
│  • MarketAux & NewsData (News Synthesis)                    │
│  • Vercel Cron (Scheduled Briefs)                           │
└─────────────────────────────────────────────────────────────┘
```

---

##  Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 App Router, React 19, TypeScript | Fast, type-safe UI with streaming support |
| **Styling** | Tailwind CSS, Framer Motion, native font stack, Fraunces serif | Premium responsive design, typography & animations |
| **State Management** | Zustand | Lightweight, persistent client state |
| **Backend** | Next.js Route Handlers | Serverless API functions |
| **Database** | Supabase (PostgreSQL) | RLS-enforced data isolation |
| **Auth** | Supabase Auth (PKCE OAuth) | Secure passwordless & email flows |
| **LLM** | Mistral + Cerebras | Context-aware AI responses, embeddings & low-latency routing |
| **Market Data** | Yahoo Finance + Finnhub | Real-time quotes, profiles, fundamentals & historical data |
| **News** | MarketAux, NewsData, Yahoo RSS | Multi-source news aggregation |
| **Deployment** | Vercel | Serverless, edge-optimized hosting |

---

##  Project Structure

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

##  Intelligence & UX Innovations

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

### 7. **Confidence Scoring**
- Source reliability scoring surfaces a response confidence meter directly in chat.

### 8. **Shareable Responses**
- Public share links preserve rendered chat output and improve markdown-safe message display.

---

##  Getting Started

### Prerequisites
- **Node.js** 18+ or 20+
- **npm** or **yarn**
- Supabase project (free tier available)
- Mistral API key
- Cerebras API key (recommended for low-latency routing + fallback)

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

# AI Providers (required: at least one; recommended: both)
MISTRAL_API_KEY=your-mistral-key
CEREBRAS_API_KEY=your-cerebras-key

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

### Latest Changes (recent)
- ✅ **Chart Stability** - Fixed the market indices bar stuttering on refresh.
- ✅ **Auth Redirects** - Hardened OAuth redirects for custom-domain flows and stopped benign errors from crashing the app.
- ✅ **Conversation Intelligence** - Improved follow-up intent continuation and noisy-English normalization.
- ✅ **Google OAuth** - Switched redirect handling to the custom domain instead of `vercel.app`.
- ✅ **Source Safety** - Added Groq API error detection and defensive checks for source arrays.
- ✅ **Routing** - Marketing subdomains now resolve to the app origin, while marketing pages stay on the working origin.
- ✅ **Guest UX** - Simplified guest login CTAs, opened chat to guests, and kept the 5-prompt cap.
- ✅ **Agent Workflow** - Completed the plan-then-execute path with the Cerebras planner.
- ✅ **Branding** - Unified brand icons across the app and public assets.
- ✅ **Auth Reliability** - Wrote OAuth session cookies before redirecting to chat.
- ✅ **SEO** - Improved crawler access with `llms.txt` and semantic HTML.
- ✅ **Confidence Meter** - Added source reliability scoring and a visible confidence badge in chat.
- ✅ **Response Sharing** - Added shareable response pages with safer chat rendering.
- ✅ **Provider Upgrades** - Added the Cerebras provider and Finnhub fundamentals/profile data.
- ✅ **UI Polish** - Refined sidebar chat typography and hover behavior, plus attachment-click feedback.
- ✅ **Subdomain UX** - Fixed the info subdomain tab title.

### Recent Commits
```
6dd203a - fix: stop market indices bar from stuttering on refresh
bdc9cdb - fix: harden vercel.app OAuth redirects and benign error handling
4bd7b9e - fix: improve follow-up intent continuation and noisy-English normalization
c34eac9 - fix: route Google OAuth back to the custom domain
6b41ae0 - fix: add Groq API error detection and defensive source-array checks
ba53ac9 - fix: redirect marketing subdomains to the app origin
e7aeb2c - fix: keep marketing pages on the working origin
637d57b - fix: simplify guest login CTAs and refresh stability
5e7d045 - feat: complete plan-then-execute agent path with Cerebras planner
1daccea - feat: open chat to guests, enforce 5-prompt cap, unify brand icons
fc4ab94 - fix(auth): write OAuth session cookies before redirecting to chat
677fe8e - feat: improve GEO/SEO with AI crawler access, llms.txt, semantic HTML
0942c39 - feat: add AI confidence meter with source reliability scoring
63ddb6d - Fix shared response links and chat rendering
8f3ef64 - Add Cerebras provider with intent-based routing
0e73fe9 - Add Finnhub for US profile and fundamentals
75d22b4 - Refine sidebar chat typography and hover behavior
04fde8a - Add attachment click development notification
50ba188 - Fix info subdomain tab title
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

## Security & Privacy

- **RLS Enforced**: All database queries use Row-Level Security
- **Auth Tokens**: Supabase PKCE OAuth flow, no password stored
- **API Keys**: Environment-isolated via `.env.local`
- **User Data**: Scoped to authenticated user (auth.uid())
- **No Hallucinations**: All AI responses grounded in live market data

---

##  Performance & Scalability

- **Streaming Chat**: Low-latency responses with text-first UI
- **Edge Functions**: Vercel serverless scaling
- **Database**: Supabase PostgreSQL with connection pooling
- **Caching**: Optimized quote & history caching
- **Bundling**: Turbopack for 5-10x faster builds

---

##  Support & Feedback

- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/Eshwar02/bearbot/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Eshwar02/bearbot/discussions)
- 📧 **Email**: support@alphasight.ai

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## Acknowledgments

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
