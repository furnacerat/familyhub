-- Run this entire file only after supabase/schema.sql completes successfully.

alter table public.kid_profiles
  add column if not exists profile_id uuid unique references public.profiles(id) on delete set null;

alter table public.kid_profiles
  add column if not exists birth_date date;

alter table public.kid_chores
  add column if not exists responsibility_type text not null default 'paid-job',
  add column if not exists recurrence text not null default 'once',
  add column if not exists due_date date,
  add column if not exists due_time time,
  add column if not exists proof_note text,
  add column if not exists requested_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists streak_count integer not null default 0;

create table if not exists public.kid_responsibility_completions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  chore_id uuid not null references public.kid_chores(id) on delete cascade,
  completed_at timestamptz not null default now(),
  proof_note text,
  reward_cents integer not null default 0,
  approved_by uuid references public.profiles(id) on delete set null
);

alter table public.kid_responsibility_completions enable row level security;

create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  pickup text not null,
  destination text not null,
  needed_at timestamptz not null,
  status text not null default 'requested',
  driver_name text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.teen_work_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  employer text not null,
  shift_date date not null,
  start_time time not null,
  end_time time,
  expected_income_cents integer not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.teen_vehicle_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  vehicle text not null,
  entry_type text not null,
  logged_on date not null,
  amount_cents integer not null default 0,
  mileage integer,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.teen_money_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  item_type text not null,
  label text not null,
  amount_cents integer not null,
  due_date date,
  direction text,
  status text not null default 'open',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ride_requests enable row level security;
alter table public.teen_work_entries enable row level security;
alter table public.teen_vehicle_logs enable row level security;
alter table public.teen_money_items enable row level security;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  in_app boolean not null default true,
  daily_digest boolean not null default false,
  digest_time time not null default '18:00',
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  revoked boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.calendar_feed_tokens enable row level security;

drop policy if exists "profiles read notifications" on public.notifications;
drop policy if exists "profiles update notifications" on public.notifications;
drop policy if exists "profiles manage notification preferences" on public.notification_preferences;
drop policy if exists "adults manage calendar feeds" on public.calendar_feed_tokens;

create policy "profiles read notifications"
  on public.notifications for select
  using (
    recipient_profile_id = auth.uid()
    and household_id = public.current_household_id()
  );

create policy "profiles update notifications"
  on public.notifications for update
  using (
    recipient_profile_id = auth.uid()
    and household_id = public.current_household_id()
  )
  with check (
    recipient_profile_id = auth.uid()
    and household_id = public.current_household_id()
  );

create policy "profiles manage notification preferences"
  on public.notification_preferences for all
  using (
    profile_id = auth.uid()
    and household_id = public.current_household_id()
  )
  with check (
    profile_id = auth.uid()
    and household_id = public.current_household_id()
  );

create policy "adults manage calendar feeds"
  on public.calendar_feed_tokens for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create or replace function public.notify_household_adults(
  target_household_id uuid,
  event_type text,
  event_title text,
  event_body text,
  event_href text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (
    household_id,
    recipient_profile_id,
    notification_type,
    title,
    body,
    href
  )
  select
    target_household_id,
    profile.id,
    event_type,
    event_title,
    event_body,
    event_href
  from public.profiles profile
  where profile.household_id = target_household_id
    and profile.role in ('owner', 'adult')
$$;

create or replace function public.notify_ride_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_household_adults(
    new.household_id,
    'ride-request',
    'New ride request',
    new.pickup || ' to ' || new.destination,
    '/teen'
  );
  return new;
end;
$$;

drop trigger if exists ride_request_notification on public.ride_requests;
create trigger ride_request_notification
after insert on public.ride_requests
for each row execute function public.notify_ride_request();

create or replace function public.notify_ride_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (
      household_id,
      recipient_profile_id,
      notification_type,
      title,
      body,
      href
    )
    select
      new.household_id,
      kid.profile_id,
      'ride-update',
      'Ride request updated',
      new.destination || ' is now ' || new.status,
      '/teen'
    from public.kid_profiles kid
    where kid.id = new.kid_id and kid.profile_id is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists ride_update_notification on public.ride_requests;
create trigger ride_update_notification
after update on public.ride_requests
for each row execute function public.notify_ride_update();

create or replace function public.notify_calendar_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requires_adult_approval then
    perform public.notify_household_adults(
      new.household_id,
      'calendar-approval',
      'Calendar item needs an adult',
      new.title || ' for ' || new.person,
      '/calendar'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists calendar_approval_notification on public.calendar_events;
create trigger calendar_approval_notification
after insert on public.calendar_events
for each row execute function public.notify_calendar_approval();

create or replace function public.get_calendar_feed(feed_token uuid)
returns table (
  household_name text,
  id uuid,
  title text,
  event_date date,
  start_time time,
  end_time time,
  person text,
  location text,
  category text,
  notes text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    household.name,
    event.id,
    event.title,
    event.event_date,
    event.start_time,
    event.end_time,
    event.person,
    event.location,
    event.category,
    event.notes
  from public.calendar_feed_tokens feed
  join public.households household on household.id = feed.household_id
  left join public.calendar_events event on event.household_id = feed.household_id
  where feed.token = feed_token
    and not feed.revoked
  order by event.event_date, event.start_time
$$;

create or replace function public.current_kid_profile_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.kid_profiles
  where profile_id = auth.uid()
  limit 1
$$;

create or replace function public.request_kid_chore(
  requested_kid_id uuid,
  requested_chore_id uuid,
  completion_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
begin
  select * into caller from public.profiles where id = auth.uid();

  if caller.id is null then
    raise exception 'Must be signed in';
  end if;

  if caller.role = 'child'
    and public.current_kid_profile_id() is distinct from requested_kid_id then
    raise exception 'Children can only request their own chores';
  end if;

  update public.kid_chores
  set
    status = 'pending',
    proof_note = nullif(trim(completion_note), ''),
    requested_at = now()
  where id = requested_chore_id
    and kid_id = requested_kid_id
    and household_id = caller.household_id
    and status = 'available';

  perform public.notify_household_adults(
    caller.household_id,
    'responsibility-approval',
    'Responsibility waiting for approval',
    coalesce(
      (select name from public.kid_profiles where id = requested_kid_id),
      'A child'
    ) || ' marked a responsibility complete',
    '/kids'
  );
end;
$$;

create or replace function public.approve_kid_chore(
  approved_kid_id uuid,
  approved_chore_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  chore public.kid_chores;
  next_due date;
begin
  select * into caller from public.profiles where id = auth.uid();

  if caller.id is null or caller.role not in ('owner', 'adult') then
    raise exception 'Adult access is required';
  end if;

  select * into chore
  from public.kid_chores
  where id = approved_chore_id
    and kid_id = approved_kid_id
    and household_id = caller.household_id
    and status = 'pending';

  if chore.id is null then
    raise exception 'Pending chore not found';
  end if;

  next_due := case chore.recurrence
    when 'daily' then coalesce(chore.due_date, current_date) + 1
    when 'weekly' then coalesce(chore.due_date, current_date) + 7
    when 'monthly' then (coalesce(chore.due_date, current_date) + interval '1 month')::date
    else chore.due_date
  end;

  insert into public.kid_responsibility_completions (
    household_id,
    kid_id,
    chore_id,
    proof_note,
    reward_cents,
    approved_by
  )
  values (
    caller.household_id,
    approved_kid_id,
    chore.id,
    chore.proof_note,
    case when chore.responsibility_type = 'paid-job' then chore.reward_cents else 0 end,
    caller.id
  );

  update public.kid_chores
  set
    status = case when chore.recurrence = 'once' then 'approved' else 'available' end,
    due_date = next_due,
    approved_at = now(),
    requested_at = null,
    proof_note = null,
    streak_count = streak_count + 1
  where id = chore.id;

  if chore.responsibility_type = 'paid-job' and chore.reward_cents > 0 then
    update public.kid_profiles
    set wallet_cents = wallet_cents + chore.reward_cents
    where id = approved_kid_id;

    insert into public.kid_transactions (
      household_id,
      kid_id,
      transaction_type,
      amount_cents,
      label
    )
    values (
      caller.household_id,
      approved_kid_id,
      'chore',
      chore.reward_cents,
      chore.title
    );
  end if;

  insert into public.notifications (
    household_id,
    recipient_profile_id,
    notification_type,
    title,
    body,
    href
  )
  select
    caller.household_id,
    kid.profile_id,
    'responsibility-approved',
    'Responsibility approved',
    chore.title || ' was approved',
    '/kids'
  from public.kid_profiles kid
  where kid.id = approved_kid_id and kid.profile_id is not null;
end;
$$;

create or replace function public.create_kid_goal(
  goal_kid_id uuid,
  goal_name text,
  goal_target_cents integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  new_goal_id uuid;
begin
  select * into caller from public.profiles where id = auth.uid();

  if caller.id is null then
    raise exception 'Must be signed in';
  end if;

  if caller.role = 'child'
    and public.current_kid_profile_id() is distinct from goal_kid_id then
    raise exception 'Children can only create their own goals';
  end if;

  if caller.role not in ('owner', 'adult', 'child') then
    raise exception 'Goal access is required';
  end if;

  insert into public.kid_goals (
    household_id,
    kid_id,
    name,
    target_cents
  )
  select caller.household_id, goal_kid_id, trim(goal_name), goal_target_cents
  where exists (
    select 1 from public.kid_profiles
    where id = goal_kid_id and household_id = caller.household_id
  )
  returning id into new_goal_id;

  return new_goal_id;
end;
$$;

create or replace function public.save_to_kid_goal(
  savings_kid_id uuid,
  savings_goal_id uuid,
  requested_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  kid public.kid_profiles;
  goal public.kid_goals;
  moved_cents integer;
begin
  select * into caller from public.profiles where id = auth.uid();

  if caller.id is null then
    raise exception 'Must be signed in';
  end if;

  if caller.role = 'child'
    and public.current_kid_profile_id() is distinct from savings_kid_id then
    raise exception 'Children can only manage their own savings';
  end if;

  select * into kid
  from public.kid_profiles
  where id = savings_kid_id and household_id = caller.household_id
  for update;

  select * into goal
  from public.kid_goals
  where id = savings_goal_id and kid_id = savings_kid_id
  for update;

  moved_cents := least(
    greatest(requested_cents, 0),
    kid.wallet_cents,
    goal.target_cents - goal.saved_cents
  );

  if moved_cents <= 0 then
    return;
  end if;

  update public.kid_profiles
  set wallet_cents = wallet_cents - moved_cents
  where id = savings_kid_id;

  update public.kid_goals
  set saved_cents = saved_cents + moved_cents
  where id = savings_goal_id;

  insert into public.kid_transactions (
    household_id,
    kid_id,
    transaction_type,
    amount_cents,
    label
  )
  values (
    caller.household_id,
    savings_kid_id,
    'goal-save',
    moved_cents,
    'Moved to savings goal'
  );
end;
$$;

drop policy if exists "family read kid profiles" on public.kid_profiles;
drop policy if exists "family read kid goals" on public.kid_goals;
drop policy if exists "family read kid chores" on public.kid_chores;
drop policy if exists "family read kid transactions" on public.kid_transactions;
drop policy if exists "family read permitted kid profiles" on public.kid_profiles;
drop policy if exists "family read permitted kid goals" on public.kid_goals;
drop policy if exists "family read permitted kid chores" on public.kid_chores;
drop policy if exists "family read permitted kid transactions" on public.kid_transactions;

create policy "family read permitted kid profiles"
  on public.kid_profiles for select
  using (
    household_id = public.current_household_id()
    and (
      public.current_profile_role() in ('owner', 'adult')
      or id = public.current_kid_profile_id()
    )
  );

create policy "family read permitted kid goals"
  on public.kid_goals for select
  using (
    household_id = public.current_household_id()
    and (
      public.current_profile_role() in ('owner', 'adult')
      or kid_id = public.current_kid_profile_id()
    )
  );

create policy "family read permitted kid chores"
  on public.kid_chores for select
  using (
    household_id = public.current_household_id()
    and (
      public.current_profile_role() in ('owner', 'adult')
      or kid_id = public.current_kid_profile_id()
    )
  );

create policy "family read permitted kid transactions"
  on public.kid_transactions for select
  using (
    household_id = public.current_household_id()
    and (
      public.current_profile_role() in ('owner', 'adult')
      or kid_id = public.current_kid_profile_id()
    )
  );

drop policy if exists "family read responsibility completions"
  on public.kid_responsibility_completions;
drop policy if exists "adult write responsibility completions"
  on public.kid_responsibility_completions;

create policy "family read responsibility completions"
  on public.kid_responsibility_completions for select
  using (
    household_id = public.current_household_id()
    and (
      public.current_profile_role() in ('owner', 'adult')
      or kid_id = public.current_kid_profile_id()
    )
  );

create policy "adult write responsibility completions"
  on public.kid_responsibility_completions for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'ride_requests',
    'teen_work_entries',
    'teen_vehicle_logs',
    'teen_money_items'
    ,'notifications'
    ,'notification_preferences'
  ]
  loop
    execute format('drop policy if exists "family read own teen data" on public.%I', target_table);
    execute format('drop policy if exists "family create own teen data" on public.%I', target_table);
    execute format('drop policy if exists "family update own teen data" on public.%I', target_table);

    execute format(
      'create policy "family read own teen data" on public.%I for select using (
        household_id = public.current_household_id()
        and (
          public.current_profile_role() in (''owner'', ''adult'')
          or kid_id = public.current_kid_profile_id()
        )
      )',
      target_table
    );
    execute format(
      'create policy "family create own teen data" on public.%I for insert with check (
        household_id = public.current_household_id()
        and (
          public.current_profile_role() in (''owner'', ''adult'')
          or kid_id = public.current_kid_profile_id()
        )
      )',
      target_table
    );
    execute format(
      'create policy "family update own teen data" on public.%I for update using (
        household_id = public.current_household_id()
        and (
          public.current_profile_role() in (''owner'', ''adult'')
          or kid_id = public.current_kid_profile_id()
        )
      )',
      target_table
    );
  end loop;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'calendar_events',
    'household_lists',
    'list_items',
    'reminders',
    'kid_profiles',
    'kid_goals',
    'kid_chores',
    'kid_transactions',
    'kid_responsibility_completions',
    'maintenance_tasks',
    'maintenance_completions',
    'budget_paychecks',
    'budget_bills',
    'budget_reserves'
    ,'ride_requests'
    ,'teen_work_entries'
    ,'teen_vehicle_logs'
    ,'teen_money_items'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        table_name
      );
    end if;
  end loop;
end
$$;
