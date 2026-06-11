# Family Hub

A private household web app for shared family organization, adult budgeting, kid-friendly money habits, and home maintenance reminders.

## Current Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- lucide-react icons

## Run Locally

```bash
npm run dev
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Supabase Setup

Local secrets live in `.env.local`, which is ignored by Git. Copy `.env.example`
when setting up another machine.

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor before
creating your first household. It creates:

- household profiles and roles
- row level security policies
- shared calendar/list/reminder tables
- kids money tables
- maintenance tables
- budget tables with adult-only budget access
- first-household setup RPC

Then run `supabase/phase-1-persistence.sql`. It adds the completed product
roadmap: persistent realtime workspaces, private child-profile linking,
recurring responsibilities, teen tools, notifications, and calendar feeds.

After the SQL is applied, create an account at `/login`, then finish owner setup
at `/setup`.

Owners can create household invites at `/settings/invites`. The app generates a
private invite link and opens a prefilled email draft. Automatic email delivery
can be added later with a server-only mail provider.

## Initial App Areas

- `/` - Family dashboard
- `/calendar` - Persistent shared calendar with filters and approval-aware events
- `/lists` - Persistent shopping and household lists
- `/reminders` - Persistent assigned reminders with completion workflow
- `/budget` - Adult-only manual budget companion
- `/kids` - Age-aware money goals, responsibilities, paid jobs, and approvals
- `/maintain` - Persistent home and vehicle maintenance by date or mileage
- `/teen` - Age-aware rides, work shifts, driving, vehicle costs, and teen money coordination
- `/notifications` - Actionable household inbox and digest preferences
- `/calendar/integrations` - Private ICS subscription and calendar import
- `/settings/family` - Owner-managed child profiles and account linking

## Roadmap Status

See `ROADMAP.md` for the completed implementation checklist and deployment
requirement.
