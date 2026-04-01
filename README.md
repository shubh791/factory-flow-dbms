# FactoryFlow DBMS

**FactoryFlow** is a production-ready, real-time industrial DBMS analytics system with an integrated AI assistant. Built for factory managers and executives — live production analytics, workforce management, AI-powered forecasting, and intelligent decision support.

---

## Features

- **Real-Time Dashboard** — KPIs auto-refresh instantly after any CRUD operation anywhere in the app
- **AI Assistant** — Powered by Groq (llama-3.3-70b-versatile); knows all live data; can answer questions, guide operations, and execute CRUD actions via chat
- **Production Management** — Full CRUD with shift, defect, revenue, and profit tracking
- **Workforce Management** — Employees, roles (hierarchy), promotions with full audit trail
- **Decision Intelligence** — IPI score, AI production forecast, anomaly detection, executive Q&A
- **PDF Export** — Multi-page report with real data + AI-generated insights

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Framework | Next.js 15 (App Router)           |
| Database  | PostgreSQL                        |
| ORM       | Prisma 5                          |
| AI        | Groq API (llama-3.3-70b-versatile)|
| PDF       | PDFKit                            |
| Charts    | ECharts (echarts-for-react)       |
| UI        | Tailwind CSS + Framer Motion      |

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/factoryflow"
GROQ_API_KEY="your_groq_api_key"
```

### 3. Initialize database
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run
```bash
npm run dev
# Open http://localhost:3000
```

---

## How the AI Works

1. **Every chat message** triggers a parallel fetch of 10+ live DB queries (employee counts, today's units, top producers, product defect rates, etc.)
2. **All data is injected** into a detailed system prompt so the AI has full factory context
3. **Streaming responses** are delivered token-by-token for real-time feel
4. **Action blocks** — when the AI suggests a CRUD operation, it returns a structured JSON block; the UI renders an interactive card; clicking Execute calls `/api/ai/action` and emits real-time events across all pages
5. **Event bus** (`lib/events.js`) propagates data changes instantly without page reload

---

## Project Structure

```
app/                  Next.js pages + API routes
  api/ai/             AI endpoints (chat, action, forecast, anomaly)
  api/analytics/      KPI aggregations
  api/employees/      Employee CRUD
  api/production/     Production CRUD
  api/reports/        PDF generation
components/
  ai/                 AskAIChat, FloatingChat, AIInsightPanel
  charts/             Production + Efficiency ECharts
  layout/             Shell, Sidebar, Navbar
lib/
  events.js           Real-time event bus
  hooks/              useFactoryData (cached), useAIInsights
  prompts/            AI prompt builders
prisma/
  schema.prisma       DB schema
  seed.js             Sample data
```
