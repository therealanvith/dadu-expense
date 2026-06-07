# Kuberly — AI-Powered Expense Tracker

Kuberly is a professional, AI-powered personal finance and expense management platform built using **Next.js 15**, **Supabase**, **Tailwind CSS**, and **Google Gemini AI**. It is designed with a premium, minimal aesthetic, utilizing a custom warm-beige theme in light mode, clean border radii, and a complete suite of vector SVG iconography.

🔗 **Live Demo**: [https://dadu-expense.vercel.app](https://dadu-expense.vercel.app)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Key Features](#key-features)
4. [API Endpoints](#api-endpoints)
5. [Directory Structure](#directory-structure)
6. [Design System & Styling Tokens](#design-system--styling-tokens)
7. [Environment Variables Setup](#environment-variables-setup)
8. [Getting Started (Local Deployment)](#getting-started-local-deployment)

---

## Test Credentials

To explore the app without signing up:

| Field    | Value                        |
|----------|------------------------------|
| Email    | `admin.daduexpenses@gmail.com`   |
| Password | `Admin123`  |

Or sign in with Google using any Google account.

---

## Architecture Overview

Kuberly uses a modern serverless stack to optimize performance and responsiveness:

- **Frontend**: Next.js App Router with React Client Components for real-time reactivity and Server Actions/APIs for database communications.
- **Database**: Supabase PostgreSQL.
- **Authentication**: NextAuth.js handling secure user sessions.
- **AI Engine (Gemini API)**: Processes voice recordings and OCR text transcriptions, converting unstructured natural language into formatted JSON payloads containing category, amount, and description.
- **OCR Engine (Tesseract.js)**: Runs client-side WebAssembly to extract text content directly from receipt uploads.
- **Email Notifications (Brevo)**: Dispatches beautifully designed progress alerts and monthly expense summaries with HTML layouts matched to Kuberly's color scheme.

---

## Database Schema

Kuberly relies on three primary PostgreSQL tables hosted on Supabase:

### 1. `expenses` Table
Stores individual transaction entries.
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- User's email from NextAuth session
  amount NUMERIC(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('food', 'travel', 'health', 'shopping', 'entertainment', 'investments', 'other')),
  description TEXT,
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'voice', 'ocr', or 'subscription'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. `budgets` Table
Sets limit thresholds per category.
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL UNIQUE,
  limit_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. `subscriptions` Table
Tracks recurring subscriptions and auto-posts expenses on due dates.
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  frequency VARCHAR(50) DEFAULT 'monthly', -- 'weekly', 'monthly', 'yearly'
  next_due_date DATE NOT NULL,
  last_processed DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## Key Features

### 1. Authentication
- **Google OAuth** — one-click sign in with any Google account via NextAuth v5.
- **Email + Password** — traditional credentials-based login with secure session handling.
- Sessions are JWT-based, user identity is their email, used as `user_id` across all tables.

### 2. Intelligent Expense Input
- **Voice Parser**: A recording module powered by the browser's SpeechRecognition API. The audio transcript is processed via a server-side Gemini prompt that maps transaction descriptions (e.g. *"spent five hundred and twenty on coffee"*) into:
  ```json
  { "amount": 520, "category": "food", "description": "Coffee" }
  ```
- **OCR Scan**: Processes images of invoices or paper receipts using Tesseract.js client-side before sending the text to the Gemini parser.
- **Interactive Form**: A validation step allows users to review and manually edit parsed amounts, categories, and descriptions before saving.

### 2. Spending Heatmap & Visual Charts
- **Heatmap Grid**: Fits 30 days of historical expense data into a single row on desktop screens, scaling dynamically using a 30-column grid (`repeat(30, minmax(0, 1fr))`).
- **Programmable Tiers**: Cell background opacities range from `0.1` (light usage) to `1.0` (maximum usage) in `0.1` increments, programmatically calculated based on spending.
- **Standardized Timezone**: Programmatic charts and heatmap calculations normalize dates using the Indian Standard Timezone (`Asia/Kolkata`) and local formatting (`DD/MM/YYYY`).

### 3. Smart Budgets & Alerts
- **Auto-Suggest Margin**: Calculates average historical spending from the past 30 days and suggests standard category budget limits set above that average.
- **Flagged Unusual Spikes**: Detects unusual expense amounts that exceed typical daily category averages (2× category average, minimum 3 expenses).
- **Alert Flags**: Inline warnings at 80% capacity (⚠️ Near limit) and 100% capacity (🚨 Over limit).
- **Overall Monthly Budget**: Set a single limit across all categories in addition to per-category limits.

### 4. Subscription Renewal Engine
- Running POST queries on `/api/process-subscriptions` checks for active subscriptions whose `next_due_date` is today or earlier, automatically inserts a corresponding transaction into `expenses` (labeled `source: "subscription"`), and advances the next due date.
- Processes silently on every dashboard load — no cron job required.

### 5. Email Alerts & Monthly Summary
- Budget alert emails sent via Brevo when any category or overall budget hits 80%.
- Monthly summary email with full category breakdown, triggerable manually from the dashboard.
- Sends to any user's email address — no custom domain required.

### 6. Export (CSV & PDF)
- **CSV Export** — downloads all currently filtered expenses as a `.csv` file. Respects active search, category, source, and date filters.
- **PDF Export** — opens a browser print dialog with a cleanly formatted expense table including totals. Also respects active filters.
- No external libraries needed — both use pure browser APIs.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/expenses` | Fetch + create expenses |
| PATCH/DELETE | `/api/expenses/[id]` | Edit + delete expense |
| POST | `/api/parse-expense` | Gemini AI parsing for voice + OCR |
| GET/POST | `/api/budgets` | Fetch + set budget limits |
| POST | `/api/alerts` | Check budgets + send alert email via Brevo |
| GET | `/api/suggest-budgets` | Auto-suggest limits from last 30 days |
| GET | `/api/flag-expenses` | Detect unusual expenses (2× category average) |
| POST | `/api/monthly-summary` | Send monthly summary email via Brevo |
| GET/POST/DELETE | `/api/subscriptions` | Manage subscriptions |
| POST | `/api/process-subscriptions` | Auto-process due subscriptions on dashboard load |

---

## Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── alerts/                  # Budget threshold alerts endpoint
│   │   ├── budgets/                 # CRUD endpoint for budget limits
│   │   ├── expenses/                # CRUD endpoint for expense items
│   │   ├── flag-expenses/           # Unusual expense detection
│   │   ├── monthly-summary/         # Monthly summary email trigger
│   │   ├── parse-expense/           # Gemini AI extraction API
│   │   ├── process-subscriptions/   # Auto-renewal check on dashboard load
│   │   ├── subscriptions/           # CRUD endpoint for subscriptions
│   │   └── suggest-budgets/         # Budget recommendation route
│   ├── budgets/                     # Budget management page
│   ├── charts/                      # Graphs, heatmaps, and stats page
│   ├── dashboard/                   # Main statistics & overview
│   ├── expenses/                    # Filterable transaction tables
│   ├── subscriptions/               # Recurring bills management
│   ├── globals.css                  # Global variables & responsive typography
│   └── layout.tsx                   # Site shell & session injection
├── components/
│   ├── BudgetManager.tsx            # Budget status progress & alerts UI
│   ├── Charts.tsx                   # Heatmaps & Recharts components
│   ├── ExpenseTable.tsx             # Tabular transactions, CSV & PDF export
│   ├── FloatingAdd.tsx              # Quick-add float button & manual form modal
│   ├── Navbar.tsx                   # Pill badge navigation and theme toggle
│   ├── OcrUpload.tsx                # Receipt reader UI using Tesseract
│   ├── SubscriptionManager.tsx      # Subscriptions list & scheduling form
│   ├── ThemeProvider.tsx            # Dark/light theme context provider
│   ├── Toast.tsx                    # Event-based non-intrusive alerts
│   └── VoiceInput.tsx               # Voice expense entry with text fallback
├── lib/
│   ├── email.ts                     # Brevo notification HTML templates
│   ├── parseExpense.ts              # Gemini API system instruction prompts
│   └── supabase-admin.ts            # Admin server-side client connection
```

---

## Design System & Styling Tokens

Kuberly implements a premium, cohesive UI design centered around these design tokens in `app/globals.css`:

### Light Mode Theme (Warm Beige)
```css
[data-theme="light"] {
  --bg: #f5f2eb;             /* Curated warm beige base */
  --bg-surface: #fbfaf7;     /* Clean white-beige cards */
  --bg-elevated: #ebe7dd;    /* Inputs, badge default backgrounds */
  --border: #e2ddd0;         /* Subtle borders */
  --border-strong: #d0c8b8;  /* Strong boundaries */
  --text-1: #1c1917;         /* High-contrast text */
  --text-2: #44403c;
  --text-3: #78716c;
}
```

### Dark Mode Theme (Default / Deep Charcoal)
```css
:root {
  --bg-base: #0c0c0f;        /* Deep charcoal base */
  --bg-surface: #111115;     /* Sleek dark cards */
  --bg-elevated: #18181d;    /* Elevated elements & inputs */
  --border: rgba(255, 255, 255, 0.07); /* Subtle borders */
  --border-strong: rgba(255, 255, 255, 0.13); /* Strong boundaries */
  --text-1: #f2f2f4;         /* High-contrast text */
  --text-2: #9898a6;
  --text-3: #5c5c6e;
}
```

---

## Environment Variables Setup

Create a `.env.local` file in the root directory:

```env
# Auth.js v5 Secret
AUTH_SECRET=generate_a_random_32_char_string

# Google OAuth
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Supabase Admin Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI Prompt Key
GEMINI_API_KEY=your_google_gemini_api_key

# Brevo Transactional Email credentials
BREVO_API_KEY=your_brevo_api_key
```

---

## Getting Started (Local Deployment)

### 1. Prerequisite Installations
Ensure you have **Node.js (v18+)** and **npm** installed on your workstation.

### 2. Project Installation
Clone the repository and install the project dependencies:
```bash
git clone https://github.com/user/dadu-expense.git dadu-expense
cd dadu-expense
npm install
```

### 3. Database Deployment
Run the SQL definitions described in the [Database Schema](#database-schema) section within your Supabase SQL editor.

### 4. Running the App
Execute the development build server locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your local browser to log in and start tracking your expenses!

---

## Known Limitations

- **Voice input** — only works in Chrome and Edge (Web Speech API). Text fallback available for other browsers.
- **Email sender** — uses `nanvith2007@gmail.com` via Brevo. A custom domain would be used in a production deployment.