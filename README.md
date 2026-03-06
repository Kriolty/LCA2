# LCA2 — Leads Club Australia: Client Portal

**Domain:** app.leadsclubaustralia.com.au

This is the authenticated client portal for Leads Club Australia members. It provides:

- **My Leads** — View and manage assigned leads
- **Territory Settings** — Configure location, vertical, and quality preferences
- **Auctions** — Browse and bid on premium leads
- **Deal Pipeline** — Track leads through sales stages
- **Appointments** — Manage scheduled appointments
- **Subscription Management** — View and upgrade subscription plans
- **Usage Reports** — Analytics on lead performance
- **Onboarding Wizard** — Step-by-step setup for new clients
- **Webhook Management** — Configure integrations
- **Data Export** — Download lead data as CSV
- **Referral Program** — Manage referrals and rewards
- **Quality Disputes** — Raise and track lead quality issues

## Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v7
- Supabase (Auth + Database)
- Zustand (State Management)

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

Deploy to Vercel, Netlify, or Railway. Requires Supabase backend.

```bash
npm run build
# Deploy the /dist folder
```
