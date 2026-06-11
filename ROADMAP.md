# Family Hub Roadmap

## Completed

- [x] Persistent Supabase reads and mutations for calendar, lists, reminders,
      maintenance, kids money, and budget data
- [x] Realtime household refresh and role-aware navigation and editing
- [x] Separate parent and child experiences with private child-profile linking
- [x] Personalized adult and child Today dashboards
- [x] Recurring responsibilities, paid jobs, completion notes, and approvals
- [x] Age-aware ride, work, driving, vehicle, spending, and reimbursement tools
- [x] In-app notifications, digest preferences, and actionable notification links
- [x] Private ICS subscription feed and ICS calendar import

## Deployment Requirement

Run `supabase/phase-1-persistence.sql` in the Supabase SQL editor after the
existing base schema. This migration is rerunnable and adds all tables,
functions, policies, triggers, and realtime publication entries used by the
completed roadmap.

The local environment only contains the public Supabase URL and anonymous key,
so schema migrations cannot be applied from this repository automatically.
