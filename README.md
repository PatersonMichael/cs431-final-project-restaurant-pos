# CS431 Restaurant POS

A tab-based point-of-sale web application with three role surfaces:

- **Server Console** — open tabs, add items, fire rounds to the kitchen, close out with payment
- **Kitchen Expediter** — view active tickets with live elapsed time, bump when ready
- **Manager Console** — order history, inventory management, employee schedule, analytics dashboard

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20 LTS |
| npm | 10+ |
| MySQL / MariaDB | 10.6+ |

A local MySQL or MariaDB instance must be running and accessible before starting.

## Setup

### 1. Clone and install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure the backend environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in your database credentials:

```env
# Used by Prisma CLI (migrate, generate)
DATABASE_URL="mysql://user:password@localhost:3306/restaurantpos"

# Used by the runtime Prisma client
DATABASE_HOST=localhost
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=restaurantpos
DATABASE_PORT=3306
```

> **Note:** If your password contains `#`, wrap it in quotes in `DATABASE_URL` and use the plain value (no quotes) in the individual `DATABASE_PASSWORD` variable.

### 3. Create the database

```sql
CREATE DATABASE restaurantpos;
```

### 4. Run migrations

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 5. Seed the database

```bash
cd server
npx tsx src/seed.ts
```

This inserts the baseline reference data (employees, products, discounts, etc.) **plus 120 completed orders** spread across the past 30 days with realistic distributions — required for the analytics dashboard to show meaningful data.

## Running the app

Open two terminals:

```bash
# Terminal 1 — backend (runs on http://localhost:3000)
cd server
npm run dev

# Terminal 2 — frontend (runs on http://localhost:5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Logging in

1. Select a store (store 100 is the default seeded store).
2. Pick an employee from the list:
   - **Alice Johnson** → General Manager (Manager Console)
   - **Henry Davis** → Expediter (Kitchen Expediter)
   - **Carol Lee** → Server (Server Console)
   - **David Brown** → Server (Server Console)
   - **Emma Wilson** → Server (Server Console)

## Demo golden path

1. **Login as a server** (e.g., Carol Lee) → Server Console
2. Tap **New Tab**, enter a customer name, confirm
3. Browse the menu, add 2–3 items, tap **Fire** → items sent to kitchen
4. **Open a second browser tab**, login as a cook → Kitchen Expediter
5. See the ticket appear; **double-tap** the card to bump it ready
6. Back in the server tab, tap **Close Out** on the tab
7. Apply a discount (optional), add a cash or card payment, close the tab
8. **Login as a manager** (e.g., Alice Johnson) → Manager Console
9. Open **Orders** — the completed tab appears in today's list
10. Click the row to see the full order detail
11. Open **Inventory** — check on-hand counts; any fired item's stock decreased
12. Open **Schedule** — view the week grid; click a cell to create a shift
13. Open **Analytics** — view the full dashboard for the last 30 days:
    - KPI cards (revenue, orders, avg ticket, tips)
    - Revenue over time area chart
    - Sales by employee table
    - Top products (toggle by quantity vs revenue)
    - Sales by category donut chart
    - Payment method breakdown
    - Discount usage report
14. Enable **Compare to prior period** in the date filter — KPI cards show % change and the revenue chart overlays a second series

## Project structure

```
├── client/          # React + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── api/                  # fetch-based API client, one file per resource
│       │   └── analytics.ts      # analytics endpoint client
│       ├── auth/                 # AuthContext + Login page
│       ├── components/           # shared UI components (Button, Card, Modal, Badge…)
│       │   └── analytics/        # DateRangeFilter, KpiCard, SalesTable, RevenueChart,
│       │                         #   CategoryChart, PaymentBreakdown, DiscountReport
│       ├── hooks/                # usePolling, useElapsed
│       ├── layouts/              # ServerLayout, ExpediterLayout, ManagerLayout
│       ├── lib/                  # cn, money, time utilities
│       ├── routes/               # ServerConsole/, Expediter/, Manager/
│       │   └── Manager/
│       │       └── Analytics.tsx # analytics dashboard page
│       └── types/                # api.ts — frontend DTOs
│
└── server/          # Node.js + Express + Prisma + TypeScript
    └── src/
        ├── middleware/  # employeeContext, errorHandler
        ├── routes/      # thin Express route handlers
        │   └── analytics.ts  # GET /api/analytics/* (7 endpoints)
        ├── schemas/     # Zod validation schemas
        ├── services/    # business logic (tabService, kitchenService…)
        └── types/       # api.ts — backend DTOs (source of truth)
```
