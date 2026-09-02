# FinTrack AI — AI-Powered Personal Wealth & Financial Intelligence Platform

FinTrack AI is a fintech-grade personal wealth management and AI financing platform designed for privacy, predictive financial intelligence, and automated money management. It combines client-side IndexedDB persistence, natural language processing, predictive cash flow forecasting, multimodal OCR receipt scanning, and an autonomous AI Financial Health & Anomaly engine.

---

## 🤖 AI Financing & Applied AI Architecture

| AI / Smart Feature | Technology | Capability |
|---|---|---|
| **AI Command Bar & Magic Entry** | Rule-Based & Statistical NLP | Natural language transaction parsing (*"Paid ₹450 for lunch at Subway"*) with auto-categorization. |
| **AI Financial Health & Anomaly Engine** | Deterministic Diagnostic Analytics | Real-time 0–100 health grading (A+ to D), overspending velocity detection, and emergency runway calculation. |
| **Cash Flow & Burn Rate Forecaster** | Time-Series Trend Projection | Predicts month-end cash reserves and net savings cushion based on daily run rate. |
| **AI Wealth Copilot / Advisor** | Hybrid LLM Gateway (Gemini / OpenAI / Local) | Context-aware advisor answering personalized queries on debt payoff, 50/30/20 budget blueprints, and tax pacing. |
| **Receipt Scanner OCR** | Computer Vision / OCR | Extracts merchant name, total, date, and line items directly from receipt photos. |
| **Smart CSV Categorizer** | Semantic Keyword Matching | Auto-classifies raw bank statement entries into standard fintech categories. |

---

## 🌟 Key Features

### 1. Dashboard AI Command Hub & Financial Health Snapshot
- **Natural Language Magic Bar**: Type expenses in plain English or trigger 1-click AI audits.
- **Autonomous AI Insights**: Live financial health score, pacing status, and risk alerts.
- **KPI Summary Cards**: Total Net Balance, Monthly Inflow, Monthly Outflow, and Savings Rate with MoM indicators.
- **Interactive Visualizations**: Recharts cash flow trend, donut expense allocation, and dual-bar comparisons.

### 2. Transactions & Magic NLP Entry
- **Inline AI Quick-Entry**: Record transactions in natural language in under 2 seconds.
- **Full Data Table & Mobile View**: Pagination, multi-criteria filtering, bulk actions, and CSV export.
- **Form Validation**: Strict schema validation powered by React Hook Form and Zod.

### 3. AI Receipt Scanner (Vision OCR)
- Drag-and-drop or snapshot receipts for instant OCR extraction into draft transactions.

### 4. Savings Goals & Split-the-Bill Calculator
- Target-based savings tracking with visual progress gauges.
- Multi-payer bill splitting with instant UPI QR generation.

### 5. Automated Recurring Engine & Budget Management
- Zero-backend client-side recurring engine for rent, subscriptions, and salaries.
- Monthly category limits with visual pacing indicators (Green, Amber, Red).

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **State Management:** Zustand
- **Database:** Local-First IndexedDB via Dexie.js (Zero cloud latency, 100% private)
- **Visualizations:** Recharts
- **Forms & Validation:** React Hook Form + Zod
- **AI & OCR:** Custom Deterministic NLP Engine, Gemini 1.5 Flash API Gateway, Canvas Confetti

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle
npm run build
```
