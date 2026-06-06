# Sentinel — Security Guard Management Platform

A full-stack security guard management platform built with Next.js and self-hosted Supabase. Designed for security companies to manage their workforce, track patrol activity, handle incident reporting, and respond to SOS emergencies — all in one dark, professional interface.

---

## Live Deployment

| | |
|---|---|
| **Production URL** | https://asas-new-imran-khans-projects-458b6e01.vercel.app |
| **Vercel Project** | `asas-new` (team: `imran-khans-projects-458b6e01`) |
| **GitHub Repo** | https://github.com/IKImranKhanIK/asas |
| **Latest Deploy ID** | `dpl_Fi9SViyiBTdTLbS7C76TG6BmqSHJ` |

---

## Features

### For Guards
- **Clock In / Clock Out** — start and end shifts with GPS location capture
- **QR Location Checks** — scan QR codes at patrol points to log visits
- **Write Reports** — submit incident, patrol, maintenance, or general reports
- **SOS Alert** — trigger an emergency alert with live GPS coordinates
- **Messages** — receive broadcast and direct messages from supervisors
- **Lone Worker Timer** — automatic check-in timer with escalation
- **Profile** — view and edit your own account details

### For Admins & Supervisors
- **Dashboard** — live overview: who's clocked in, active SOS alerts, recent activity
- **Guard Management** — create accounts, assign badge numbers, roles, manage active status
- **Location Management** — add patrol points and generate downloadable QR codes
- **Shift Summary** — weekly grid showing clock-in/out times and hours per guard per day
- **Performance** — weekly stats per guard: hours, days worked, check-ins, reports filed
- **Reports** — view all submitted reports with severity and type badges
- **SOS / Emergency** — see all active alerts with GPS links, resolve them in one click
- **Messages** — send broadcast or direct messages to guards

### Platform
- **Role-based access** — Admin, Supervisor, and Guard roles with database-level Row Level Security
- **Dark professional UI** — gray-950/900/800 background palette with blue-600 primary
- **Mobile-friendly** — works in any browser on phone or desktop; no app install required
- **Email notifications** — Resend integration for alerts (optional, degrades gracefully if key absent)
- **Auto-deploy** — Pi tunnel URL sync script keeps Vercel env vars in sync on restart

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 (CSS-first config, `@import "tailwindcss"`) |
| Auth & Database | Supabase (self-hosted on Raspberry Pi 4 via Docker Compose) |
| Supabase Client | `@supabase/ssr` — `createBrowserClient` / `createServerClient` |
| Route Protection | `src/proxy.ts` (Next.js 16 renames middleware → proxy) |
| QR Codes | `qrcode` (generate) + `jsqr` (scan via camera) |
| Location | Browser Geolocation API + Google Maps links |
| Email | Resend (lazy-loaded, optional) |
| Dates | `date-fns` |
| Deployment | Vercel (hobby plan) |
| Tunnel | Cloudflare trycloudflare.com HTTP tunnel |

---

## Infrastructure

### Self-Hosted Supabase (Raspberry Pi 4)

Supabase runs via Docker Compose on a local Raspberry Pi 4 (8 GB RAM). It is exposed to the internet via a Cloudflare trycloudflare.com HTTP tunnel (URL changes on Pi restart).

A script on the Pi (`/home/ik/update-vercel-tunnel.sh`) runs on boot and automatically:
1. Detects the new tunnel URL
2. Updates the `NEXT_PUBLIC_SUPABASE_URL` env var in Vercel for both Sentinel and HalalMatch
3. Triggers a redeployment of both Vercel projects

> **Note:** trycloudflare.com is HTTP-only — raw PostgreSQL TCP connections are not possible through it. The app uses the Supabase HTTP API exclusively (no direct `pg` / Prisma connection).

### Shared Supabase Instance

Sentinel shares the same Raspberry Pi Supabase instance as HalalMatch. Table names are prefixed/named to avoid conflicts (e.g. `guard_messages` instead of `messages`). The `on_guard_user_created` trigger is separate from any HalalMatch triggers.

---

## Database Schema

All tables have permissive RLS policies (`FOR ALL USING (true)`) — tighten per-table as needed.

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user — `full_name`, `role` (admin/supervisor/guard), `badge_number`, `phone`, `is_active`, `avatar_url` |
| `clock_events` | Clock-in and clock-out events with `guard_id`, `timestamp`, `lat`, `lng` |
| `location_checks` | QR scan events with `guard_id`, `location_id`, `timestamp`, `lat`, `lng` |
| `locations` | Patrol points with `name`, `address`, `qr_code` |
| `reports` | Incident/patrol/maintenance/general reports with `type`, `severity`, `body`, `guard_id` |
| `sos_alerts` | Emergency alerts with `guard_id`, `lat`, `lng`, `status` (active/resolved), `resolved_by`, `resolved_at` |
| `guard_messages` | Direct and broadcast messages with `sender_id`, `recipient_id`, `subject`, `body`, `is_broadcast`, `is_read` |
| `shifts` | Scheduled shifts with `guard_id`, `start_time`, `end_time`, `location_id` |

**Trigger:** `on_guard_user_created` → `handle_new_guard_user()` automatically creates a `profiles` row when a new user is added to `auth.users`.

---

## Project Structure

```
src/
├── proxy.ts                        # Route protection (Next.js 16 — named "proxy" not "middleware")
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Dark login page with Sentinel branding
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell (sidebar + topbar)
│   │   ├── dashboard/page.tsx      # Overview: stats, SOS banner, recent activity
│   │   ├── clock/page.tsx          # Clock in/out with hours counter
│   │   ├── guards/
│   │   │   ├── page.tsx            # Guard list with role/status badges
│   │   │   └── [id]/              # Individual guard detail + edit form
│   │   ├── locations/
│   │   │   ├── page.tsx            # Location list with QR download
│   │   │   ├── new/               # Add new location form
│   │   │   └── scan/              # QR scanner (camera)
│   │   ├── reports/
│   │   │   ├── page.tsx            # All reports with severity badges
│   │   │   ├── new/               # New report form
│   │   │   └── [id]/              # Individual report detail
│   │   ├── sos/page.tsx            # Active SOS alerts + history
│   │   ├── messages/
│   │   │   ├── page.tsx            # Message inbox
│   │   │   └── new/               # Compose new message
│   │   ├── shifts/page.tsx         # Weekly shift grid per guard
│   │   ├── performance/page.tsx    # Weekly performance stats
│   │   ├── map/page.tsx            # Live guard map
│   │   └── profile/               # Profile view + edit form
│   └── api/
│       ├── auth/callback/route.ts  # Supabase auth code exchange
│       ├── auth/signout/route.ts   # Sign out
│       ├── guards/create/route.ts  # Create guard account (service role)
│       └── cron/route.ts           # Daily cron job (09:00 UTC — Vercel hobby limit)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Dark sidebar with SENTINEL branding, role-filtered nav
│   │   └── TopBar.tsx              # Date display, user info, role dot indicator
│   ├── LoneWorkerTimer.tsx         # Countdown timer with auto-alert escalation
│   └── NotificationBell.tsx        # Unread notification badge
└── lib/
    ├── supabase/
    │   ├── client.ts               # createBrowserClient
    │   ├── server.ts               # createServerClient + createAdminClient
    │   └── schema.sql              # Full DB schema
    └── notifications.ts            # Resend email (lazy-loaded, optional)
```

---

## Key Implementation Notes

### Next.js 16 Breaking Change
Next.js 16 renames `middleware.ts` → `proxy.ts` and requires the exported function to be named `proxy` (not `middleware`). The matcher config is the same.

```ts
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
```

### Tailwind CSS v4
No `tailwind.config.js`. Config lives in `globals.css`:

```css
@import "tailwindcss";
@theme {
  --color-gray-950: #0a0a0f;
  --color-gray-900: #111118;
  --color-gray-800: #1a1a24;
  /* ... */
}
```

### Resend (Email) — Lazy Import
Resend is dynamically imported only when `RESEND_API_KEY` is present. Top-level `new Resend()` would crash the build if the key is missing.

### Vercel Cron — Hobby Plan
Cron is limited to once per day on the hobby plan. Schedule: `0 9 * * *` (09:00 UTC).

---

## Getting Started (Local Dev)

### 1. Clone and install

```bash
git clone https://github.com/IKImranKhanIK/asas.git
cd asas
npm install
```

### 2. Configure environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-tunnel-or-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key        # optional
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to login.

### 4. Create your first admin user

1. Go to Supabase Studio → **Authentication → Users** → **Add user**
2. Then in the SQL editor run:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

Or find the user by email:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## Deployment (Vercel)

1. Push to GitHub (already connected)
2. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY` *(optional)*
3. Vercel auto-deploys on push to `main`

---

## Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access — manage guards, locations, view all data, send messages, resolve SOS |
| **Supervisor** | Manage locations, view all data, send messages, resolve SOS |
| **Guard** | Clock in/out, scan QR, submit reports, trigger SOS, view own messages |

Route-level enforcement is in `src/proxy.ts`. Page-level enforcement redirects non-admins away from admin-only pages. Row Level Security enforces at the database level.

---

## Design System

| Token | Value |
|-------|-------|
| `gray-950` | `#0a0a0f` — page background |
| `gray-900` | `#111118` — card background |
| `gray-800` | `#1a1a24` — input/hover |
| `gray-700` | `#252533` — borders |
| `blue-600` | primary action, active nav |
| `red-500` | SOS, danger |
| `green-500` | active/online |
| `amber-500` | warnings, broadcasts |

Cards use `bg-gray-900 border border-gray-800 rounded-2xl`. Badges use the `.badge` utility class defined in `globals.css`.
