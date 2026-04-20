# ASAS Security Platform

A full-stack security guard management platform built for [asastx.com](https://asastx.com). Designed for security companies to manage their workforce, track patrol activity, and handle incident reporting — all in one place.

---

## Features

### For Guards
- **Clock In / Clock Out** — start and end shifts with automatic GPS location capture
- **QR Location Checks** — scan QR codes posted at patrol points to log that you visited
- **Write Reports** — submit incident, patrol, maintenance, or general reports from any device

### For Admins & Supervisors
- **Guard Management** — create accounts for guards and supervisors, assign badge numbers and roles
- **Location Management** — add patrol points and generate downloadable QR codes for each one
- **Dashboard Overview** — see who's clocked in, recent activity, and pending reports at a glance
- **View All Reports** — review every report submitted across the team

### Platform
- **Role-based access** — Admin, Supervisor, and Guard roles with database-level Row Level Security
- **Mobile-friendly** — works in any browser on phone or desktop; no app install required

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL + RLS) |
| QR Codes | `qrcode` (generate) + `jsqr` (scan via camera) |
| Location | Browser Geolocation API |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/
│   │   ├── dashboard/         # Overview stats
│   │   ├── clock/             # Clock in/out
│   │   ├── reports/           # Reports list + new report form
│   │   ├── locations/         # Patrol points, QR codes, QR scanner
│   │   └── guards/            # Guard list + create account form
│   └── api/
│       ├── auth/signout/      # Sign out route
│       └── guards/create/     # Create guard account (service role)
├── components/layout/         # Sidebar, TopBar
├── lib/supabase/              # Supabase client, server client, schema.sql
└── types/                     # Shared TypeScript types
```

---

## Getting Started

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `src/lib/supabase/schema.sql`
3. Copy your project URL and API keys from **Project Settings → API**

### 2. Configure environment

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to login.

### 4. Create your first admin account

In Supabase → **Authentication → Users**, create a user manually. Then in the SQL editor run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Deployment

Deploy to [Vercel](https://vercel.com):

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Add the three environment variables from `.env.local`
4. Deploy — Vercel handles the rest

---

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access — manage guards, locations, view all data |
| **Supervisor** | Manage locations, view all reports and clock events |
| **Guard** | Clock in/out, scan QR codes, submit and view own reports |
