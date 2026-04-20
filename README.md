# ASAS Security Platform

Security guard management platform for [asastx.com](https://asastx.com).

## Features
- **Clock In/Out** — guards clock in/out with GPS location capture
- **QR Location Checks** — scan QR codes at patrol points to log presence
- **Reports** — write incident, patrol, maintenance, and other reports
- **Guard Management** — admins create and manage guard/staff accounts
- **Role-based access** — Admin, Supervisor, Guard with Row Level Security

## Stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Supabase (Auth, PostgreSQL, RLS)

## Setup

1. Create a [Supabase](https://supabase.com) project
2. Run `src/lib/supabase/schema.sql` in the Supabase SQL editor
3. Fill in `.env.local` with your Supabase URL and keys
4. `npm install && npm run dev`

## Deployment
Deploy to Vercel — connect the repo and add env vars from `.env.local`.
