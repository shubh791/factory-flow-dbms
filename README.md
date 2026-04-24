# FactoryFlow DBMS

A full-stack factory management system for tracking employees, production batches, defect rates, and performance analytics — with an AI-powered chat assistant and real-time dashboard.

---

## Features

- **Employee Management** — Add, update, promote, and soft-delete employees with full role/department assignment and promotion history tracking
- **Production Tracking** — Log production batches with units, defects, shift, date, and assigned employee; view paginated records with filters
- **Analytics Dashboard** — Live KPIs: efficiency %, defect rates, revenue, profit; per-department, per-product, and per-shift breakdowns with charts
- **AI Chat Assistant** — Conversational interface powered by Groq LLM; answers analytics questions and executes CRUD actions (add/update/delete) via verified chat commands
- **Anomaly Detection** — Flags days with statistically abnormal defect rates using standard deviation analysis
- **Production Forecasting** — Predicts next month's output and defect rate from historical monthly trends
- **Smart CSV Import** — Upload any CSV; system auto-detects data type, fuzzy-maps column headers to DB fields, and handles unknown values before import
- **PDF Report Export** — Generates multi-slide performance reports with rendered charts using headless Chromium
- **Real-time Event Bus** — All open pages update instantly when data changes — no page reload required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | PostgreSQL |
| ORM | Prisma |
| AI | Groq API (Llama models) |
| Charts | Apache ECharts |
| PDF | Puppeteer + pdf-lib |

---

## Database Schema

- **Employee** — name, code, department, role, status, experience
- **Department** — name, code
- **Role** — title, level (1 = entry, higher = senior)
- **Product** — name, unit price, unit cost
- **Production** — units, defects, shift, date, employee, product, revenue, profit
- **PromotionHistory** — employee, old role, new role, date, remarks
- **AuditLog** — action, entity, actor, timestamp

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in DATABASE_URL and GROQ_API_KEY

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/factoryflow"
GROQ_API_KEY="your_groq_api_key_here"
```

---

## Project Structure

```
factory-flow-dbms/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # Backend API endpoints
│   │   ├── ai/             # AI chat and analytics endpoints
│   │   ├── employees/      # Employee CRUD
│   │   ├── production/     # Production CRUD
│   │   └── ...
│   ├── dashboard/          # Main dashboard page
│   ├── employees/          # Employee management page
│   ├── production/         # Production records page
│   ├── analytics/          # Analytics and charts page
│   └── dataset-upload/     # CSV import page
├── components/             # Reusable React components
│   ├── ai/                 # AI chat widget
│   ├── charts/             # ECharts wrappers
│   └── ui/                 # Shared UI components
├── lib/                    # Utility modules
│   ├── prisma.js           # Prisma client singleton
│   ├── events.js           # Real-time event bus
│   ├── prompts/            # AI prompt builders
│   └── hooks/              # React data hooks
└── prisma/
    └── schema.prisma       # Database schema
```

---

## How the AI Assistant Works

1. User sends a message in the chat widget
2. Server fetches live data from the database (employees, production stats, recent records) via parallel queries
3. This data + the user's message is sent to Groq API
4. If the user requested a data change, the AI includes a structured action block in its response
5. The frontend detects the action block and shows a **Confirm & Execute** button
6. On confirmation, the action runs against the database and the UI updates in real time

---

## License

MIT
