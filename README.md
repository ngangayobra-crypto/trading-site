# Northstar Paper

A production-oriented paper-trading platform scaffold built with React, Vite, TypeScript, Supabase, PostgreSQL RLS, Recharts, TanStack Query, Tailwind CSS, and Lucide icons.

This application is a simulator. It must not accept deposits, process withdrawals, claim brokerage status, or present virtual balances as real money.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run test
npm run build
```

## Optional Supabase backend setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Apply `supabase/migrations/202607300001_initial_paper_trading.sql`.
5. Optionally apply `supabase/seed/demo_seed.sql`.

This prepares the database for a future persistent backend; the current UI does not call Supabase or Supabase Auth. Keep `SUPABASE_SERVICE_ROLE_KEY` and `MARKET_DATA_API_KEY` server-side only. Do not prefix private variables with `VITE_`.

## Demo access

The current local build uses an in-memory demo provider. It is not connected to Supabase Auth and does not create persistent user accounts.

- Enter any email address to open a normal simulated account.
- No password is required, stored, or changeable in this demo.
- The account resets when the page reloads; it is not appropriate for a live deployment.

## Architecture

- `src/services/trading-engine.ts` contains the deterministic paper-trading calculations.
- `src/services/trading-context.tsx` wires the demo provider into the app.
- `src/lib/supabase.ts` is the browser-safe Supabase client entry.
- `supabase/migrations` contains normalized PostgreSQL tables, constraints, indexes, RLS, and append-only audit logs.

## External market data

The demo provider marks all seeded prices as `SIMULATED DATA`. A production provider should run server-side, use `MARKET_DATA_API_KEY`, cache responses, and update markets without exposing credentials to the browser.
