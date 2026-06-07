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

After the SQL is applied, create an account at `/login`, then finish owner setup
at `/setup`.

Owners can create household invites at `/settings/invites`. The app generates a
private invite link and opens a prefilled email draft. Automatic email delivery
can be added later with a server-only mail provider.

## Initial App Areas

- `/` - Family dashboard
- `/calendar` - Shared family calendar with local add-event flow and filters
- `/lists` - Shopping and household lists with local add/toggle/delete/filter flow
- `/reminders` - One-off family reminders with local add/complete/reopen/delete/filter flow
- `/budget` - Adult-only manual budget companion
- `/kids` - Kid-friendly money goals, wallet activity, chores, and parent approval flow
- `/maintain` - Home and vehicle maintenance with local add/complete/filter flow for date and mileage tasks

## Next Build Steps

- Apply the Supabase schema in the hosted project.
- Add member management and invite revocation screens for owner role.
- Connect local interactive sections to persistent storage.
- Wire budget forms to the tested paycheck allocation engine.
