# FinTrack — Modern Personal Finance & Expense Tracker

FinTrack is a high-performance, fintech-grade personal expense tracker and financial management web application inspired by leading tools like YNAB, Copilot Money, and Mint. It features local-first IndexedDB persistence, interactive financial analytics charts, bank statement CSV imports with smart auto-categorization, automated recurring transactions, and monthly budget pacing.

---

## Key Features

### 1. Financial Dashboard (Home)
- **KPI Summary Cards**: Real-time metrics for Total Net Balance, Monthly Income, Monthly Expenses, and Savings Rate with month-over-month trend indicators.
- **Cumulative Cash Flow Trend**: Interactive Recharts area chart with 30-day, 90-day, and 1-year filters.
- **Category Breakdown**: Interactive Donut chart displaying current month expense distribution with category legends and share percentages.
- **Income vs Expense Comparison**: 6-month historical dual-bar comparison chart.
- **Budget Health Snapshot**: Real-time spending progress and pacing alerts.
- **Recent Transactions Feed**: Quick view of latest inflows and debits with category tags.

### 2. Transactions Management
- **Full Data Table & Mobile Card View**: Responsive layout with column sorting, items-per-page selector, and pagination.
- **Multi-Criteria Filtering**: Search by description/notes, filter by category, type (Income/Expense), date ranges (This Month, Last Month, This Year, Custom Range), and recurring status.
- **CRUD Operations**: Add, edit, or delete transactions with modal forms backed by React Hook Form + Zod validation.
- **Bulk Actions**: Select multiple transactions for bulk deletion or export to CSV.

### 3. Budget Goals & Health
- **Category Budget Limits**: Configure monthly limits per category with immediate recalculation.
- **Visual Progress Gauges**: Color-coded progress indicators (Green `<80%`, Amber `80-100%`, Red `>100%`).
- **Month Navigator**: Seamlessly view and plan budgets across past, current, and upcoming months.
- **Budget Alert Badges**: Highlights over-budget and near-limit categories with remaining balance calculations.

### 4. Automated Recurring Engine
- **Flexible Frequencies**: Daily, Weekly, Monthly, and Yearly recurrence rules.
- **Zero-Backend Automation**: Evaluates and automatically generates due transaction instances on app load.
- **Rule Manager**: Dedicated dashboard to pause/resume rules, edit amounts, review next scheduled occurrence dates, or trigger immediate execution.

### 5. Smart CSV Bank Statement Import
- **Drag-and-Drop Uploader**: Accepts CSV exports from any financial institution (Chase, Bank of America, Amex, Apple Card, PayPal, Revolut, etc.).
- **Column Mapping Wizard**: Auto-detects Date, Description, Amount, Type, and Category columns.
- **Auto-Categorizer**: Intelligent keyword matching engine (e.g., "Uber" → Transport, "Starbucks" → Food & Dining, "Netflix" → Subscriptions).
- **Duplicate Detection**: Identifies matching date + amount + description pairs against existing records.
- **Inline Editable Grid**: Review and modify category suggestions before committing the import.

### 6. Categories & Customization
- **Default Categories**: Preloaded with curated fintech categories.
- **Custom Category Creator**: Create custom categories with Lucide icons and hex color palette selector.
- **Usage Statistics**: Track total volume and transaction count per category.

### 7. Settings & Data Management
- **Multi-Currency Support**: Switch between USD ($), EUR (€), GBP (£), INR (₹), CAD (CA$), AUD (A$), JPY (¥), CHF, SGD (S$), and AED.
- **Appearance Themes**: Sleek Dark Mode, Clean Light Mode, and System Default.
- **Data Export & Backups**: Export transactions as CSV or export a full JSON database backup.
- **Backup Restoration**: Restore your database from previous JSON archives.
- **Demo Data Generator**: 1-click button to populate 90 days of rich realistic history, budgets, and recurring rules.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Utilities |
| **State Management** | Zustand |
| **Local Database** | IndexedDB via Dexie.js |
| **Charts & Visualizations**| Recharts |
| **Forms & Validation** | React Hook Form + Zod |
| **CSV Parsing & Export** | PapaParse |
| **Date Handling** | date-fns |
| **Routing** | React Router v7 |
| **Icons** | Lucide React |
| **Testing** | Vitest + React Testing Library |

---

## Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation & Local Run
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open browser at http://localhost:5173
```

### Running Tests
```bash
# Run unit tests
npm test # or npx vitest run
```

### Building for Production / Vercel
```bash
# Build the production bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## Deploying to Vercel

FinTrack is completely client-side and requires no external database servers or environment variables to get started.

1. Push this repository to GitHub / GitLab / Bitbucket.
2. Import the repository into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy!

---

## Screenshots & Demo

*(Seed demo data is included on first run or accessible in Settings & Sidebar via "Load Demo Dataset")*
