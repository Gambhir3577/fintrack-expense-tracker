# FinTrack AI — Personal Wealth Platform & Cloud Sync Backend

FinTrack AI is a fintech-grade personal wealth management and AI financing platform designed for privacy, predictive financial intelligence, and automated money management.

It operates on an **Offline-First Hybrid Architecture**:
- **Offline / Local Mode (Default):** All user transactions, categories, budgets, recurring rules, and split bills are stored locally in **Dexie.js (IndexedDB)** with zero latency. Login is completely optional, and deterministic NLP runs 100% on-device.
- **Optional Cloud Sync:** When an account is created or signed into, background synchronization connects to a secure **PostgreSQL** database via **Prisma ORM** with Last-Write-Wins (LWW) conflict resolution and multi-device sync across desktop browsers and Capacitor Android builds.
- **AI Proxy Gateway:** Gemini 1.5 Flash multimodal vision (Receipt OCR) and financial advisor requests are proxied securely through the backend server. API keys are maintained strictly in server `.env` and never exposed to client browsers.

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart TD
  subgraph Client [Frontend — React 19 + TypeScript + Capacitor]
    Dexie[(Dexie IndexedDB)] <--> Zustand[Zustand Stores]
    Zustand <--> SyncManager[Sync Engine Background Worker]
    SyncManager -->|Push / Pull| APIService[API Service Client]
    UI[App UI: Guest or Logged In] -->|AI Query / Receipt| APIService
  end

  subgraph Server [Backend — Node.js + Express + TypeScript]
    APIService -->|Bearer JWT| Middleware[Helmet + CORS + RateLimit + Zod]
    Middleware --> AuthController[Auth Controller]
    Middleware --> SyncController[Sync Push / Pull Controller]
    Middleware --> AIController[AI Advisor / Receipt OCR Controller]
    AIController -->|Server GEMINI_API_KEY| GeminiAPI[Google Gemini 1.5 Flash]
    SyncController --> Prisma[Prisma ORM]
    AuthController --> Prisma
  end

  subgraph Database [PostgreSQL]
    Prisma --> Postgres[(Neon / Supabase PostgreSQL)]
  end
```

### Frontend
- **Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Glassmorphism & Aurora Gradients
- **State & Storage:** Zustand, Dexie.js (IndexedDB)
- **Visualizations:** Recharts
- **Forms & Validation:** React Hook Form + Zod
- **Mobile Runtime:** Capacitor Android

### Backend (`/backend`)
- **Runtime:** Node.js, Express, TypeScript (ES Modules)
- **Database ORM:** Prisma with PostgreSQL (Neon / Supabase / Local)
- **Authentication:** bcrypt password hashing, JWT Access (15m) & Refresh Tokens (30d)
- **AI Gateway:** `@google/generative-ai` (Gemini 1.5 Flash Vision & Chat)
- **Security:** Helmet, Zod schema validation, Express Rate Limiter, and strict CORS whitelist

---

## 🌟 Data Synchronization & Conflict Resolution

- **Batch Endpoints:** `POST /api/sync/push` and `GET /api/sync/pull?since=<timestamp>`.
- **Conflict Rule:** Last-Write-Wins (LWW) comparing record `updatedAt` timestamps.
- **Soft Deletes:** Records marked with `deletedAt` synchronize deletions across devices cleanly without orphaned keys.
- **Financial Precision:** Currency amounts are stored as exact `Decimal(14, 2)` in PostgreSQL to prevent floating-point rounding issues.
- **Resilient Connectivity:** When network transitions from offline to online, `SyncManager` automatically triggers a two-way pull-then-push sync.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js >= 20
- PostgreSQL database (Local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
npm install
```

Edit `backend/.env`:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/fintrack?schema=public"
JWT_ACCESS_SECRET="generate_a_random_32_character_string_here"
JWT_REFRESH_SECRET="generate_another_random_32_character_string_here"
GEMINI_API_KEY="AIzaSy...your_gemini_api_key_from_google_ai_studio"
ALLOWED_ORIGINS="https://fintrack-expense-tracker-xi.vercel.app,http://localhost:5173,https://localhost,capacitor://localhost"
```

Push schema to PostgreSQL and generate Prisma Client:
```bash
npx prisma db push
```

Start backend development server:
```bash
npm run dev
```
Backend will start on `http://localhost:5001`. Verify at `http://localhost:5001/api/health`.

### 3. Configure Frontend

From the repository root:
```bash
npm install
```

(Optional) Create `.env.local` to point to local backend (defaults to `http://localhost:5001` if omitted):
```env
VITE_API_URL=http://localhost:5001
```

Start frontend development server:
```bash
npm run dev
```

Run test suite:
```bash
npm test
```

---

## 🌐 Production Deployment Guide

### Deploy Backend (Render / Railway)

#### Option A: Render
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Add Environment Variables in Render:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Neon or Supabase with `?sslmode=require`).
   - `JWT_ACCESS_SECRET`: Secure random 32+ character key.
   - `JWT_REFRESH_SECRET`: Secure random 32+ character key.
   - `GEMINI_API_KEY`: Your Google AI Studio Gemini API key.
   - `ALLOWED_ORIGINS`: `https://fintrack-expense-tracker-xi.vercel.app,https://localhost,capacitor://localhost`
   - `NODE_ENV`: `production`

#### Option B: Railway
1. Create a new project in [Railway](https://railway.app) from your repo.
2. Set Root Directory to `/backend`.
3. Set environment variables identical to Render.
4. Run `npx prisma db push` (or add to build script) to ensure database tables are created.

### Deploy Frontend (Vercel)

1. Open your FinTrack project settings in **Vercel**.
2. Under **Settings > Environment Variables**, add:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://fintrack-backend.onrender.com` or `https://backend.railway.app`).
3. Redeploy the branch preview to test cloud synchronization and AI proxy.

---

## 🔒 Security & Privacy Guarantees

- **No Secret Leakage:** Google Gemini API key is never bundled in frontend JavaScript or stored in browser storage.
- **Strict CORS:** Only the production Vercel domain, local dev server, and Capacitor Android WebView origins (`https://localhost`, `capacitor://localhost`) are accepted.
- **Sanitized Logging:** Passwords, JWT tokens, and user financial records are excluded from server logs.
- **Opt-In Cloud Sync:** Users who prefer absolute device isolation can skip login and use the full app anonymously with 100% offline local IndexedDB persistence.
