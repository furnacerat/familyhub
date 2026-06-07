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

## Initial App Areas

- `/` - Family dashboard
- `/calendar` - Shared family calendar with local add-event flow and filters
- `/lists` - Shopping and household lists with local add/toggle/delete/filter flow
- `/reminders` - One-off family reminders with local add/complete/reopen/delete/filter flow
- `/budget` - Adult-only manual budget companion
- `/kids` - Kid-friendly money goals, wallet activity, chores, and parent approval flow
- `/maintain` - Home and vehicle maintenance with local add/complete/filter flow for date and mileage tasks

## Next Build Steps

- Add authentication and household roles.
- Add database schema for family, budget, kids money, and maintenance data.
- Connect local interactive sections to persistent storage.
- Wire budget forms to the tested paycheck allocation engine.
