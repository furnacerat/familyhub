create extension if not exists "pgcrypto";

do $$ begin
  create type public.household_role as enum ('owner', 'adult', 'member', 'child');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.budget_priority as enum ('critical', 'high', 'normal', 'low');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  display_name text not null,
  role public.household_role not null default 'member',
  budget_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  event_date date not null,
  start_time time not null,
  end_time time,
  person text not null,
  location text,
  category text not null,
  notes text,
  requires_adult_approval boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  list_type text not null default 'other',
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  list_id uuid references public.household_lists(id) on delete cascade,
  name text not null,
  quantity text,
  notes text,
  added_by text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  due_date date not null,
  owner text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.kid_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  wallet_cents integer not null default 0,
  allowance_cents integer not null default 0,
  allowance_day text not null default 'Sunday',
  created_at timestamptz not null default now()
);

create table if not exists public.kid_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  name text not null,
  target_cents integer not null,
  saved_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.kid_chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  title text not null,
  reward_cents integer not null,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

create table if not exists public.kid_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kid_id uuid not null references public.kid_profiles(id) on delete cascade,
  transaction_type text not null,
  amount_cents integer not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  category text not null,
  applies_to text not null,
  assigned_to text not null,
  cadence_value integer not null,
  cadence_unit text not null,
  last_completed_date date,
  next_due_date date,
  last_completed_mileage integer,
  current_mileage integer,
  next_due_mileage integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_completions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  task_id uuid not null references public.maintenance_tasks(id) on delete cascade,
  completed_at date not null,
  mileage integer,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_paychecks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  earner text not null,
  amount_cents integer not null,
  pay_date date not null,
  status text not null default 'expected',
  created_at timestamptz not null default now()
);

create table if not exists public.budget_bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  category text not null,
  amount_cents integer not null,
  due_date date not null,
  paid boolean not null default false,
  priority public.budget_priority not null default 'normal',
  minimum_payment_cents integer,
  can_split boolean not null default false,
  has_late_fee_risk boolean not null default false,
  has_shutoff_risk boolean not null default false,
  autopay boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_reserves (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  amount_cents integer not null,
  category text not null,
  priority text not null default 'essential',
  created_at timestamptz not null default now()
);

create or replace function public.current_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_role()
returns public.household_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_budget_access()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select budget_access from public.profiles where id = auth.uid()
$$;

create or replace function public.create_household_for_current_user(
  household_name text,
  display_name text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  new_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to create a household';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  insert into public.households (name)
  values (household_name)
  returning id into new_household_id;

  insert into public.profiles (
    id,
    household_id,
    email,
    display_name,
    role,
    budget_access
  )
  values (
    auth.uid(),
    new_household_id,
    coalesce((auth.jwt() ->> 'email'), ''),
    display_name,
    'owner',
    true
  )
  returning * into new_profile;

  return new_profile;
end;
$$;

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.calendar_events enable row level security;
alter table public.household_lists enable row level security;
alter table public.list_items enable row level security;
alter table public.reminders enable row level security;
alter table public.kid_profiles enable row level security;
alter table public.kid_goals enable row level security;
alter table public.kid_chores enable row level security;
alter table public.kid_transactions enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_completions enable row level security;
alter table public.budget_paychecks enable row level security;
alter table public.budget_bills enable row level security;
alter table public.budget_reserves enable row level security;

create policy "household members read household"
  on public.households for select
  using (id = public.current_household_id());

create policy "household members read profiles"
  on public.profiles for select
  using (household_id = public.current_household_id());

create policy "owners update profiles"
  on public.profiles for update
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() = 'owner'
  );

create policy "family read calendar"
  on public.calendar_events for select
  using (household_id = public.current_household_id());

create policy "family write calendar"
  on public.calendar_events for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "family read lists"
  on public.household_lists for select
  using (household_id = public.current_household_id());

create policy "family write lists"
  on public.household_lists for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "family read list items"
  on public.list_items for select
  using (household_id = public.current_household_id());

create policy "family write list items"
  on public.list_items for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "family read reminders"
  on public.reminders for select
  using (household_id = public.current_household_id());

create policy "family write reminders"
  on public.reminders for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy "family read maintenance tasks"
  on public.maintenance_tasks for select
  using (household_id = public.current_household_id());

create policy "adult write maintenance tasks"
  on public.maintenance_tasks for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create policy "family read maintenance completions"
  on public.maintenance_completions for select
  using (household_id = public.current_household_id());

create policy "adult write maintenance completions"
  on public.maintenance_completions for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create policy "family read kid profiles"
  on public.kid_profiles for select
  using (household_id = public.current_household_id());

create policy "adult write kid profiles"
  on public.kid_profiles for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create policy "family read kid goals"
  on public.kid_goals for select
  using (household_id = public.current_household_id());

create policy "adult write kid goals"
  on public.kid_goals for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create policy "family read kid chores"
  on public.kid_chores for select
  using (household_id = public.current_household_id());

create policy "adult write kid chores"
  on public.kid_chores for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create policy "family read kid transactions"
  on public.kid_transactions for select
  using (household_id = public.current_household_id());

create policy "adult write kid transactions"
  on public.kid_transactions for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_role() in ('owner', 'adult')
  );

create policy "budget users read paychecks"
  on public.budget_paychecks for select
  using (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  );

create policy "budget users write paychecks"
  on public.budget_paychecks for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  );

create policy "budget users read bills"
  on public.budget_bills for select
  using (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  );

create policy "budget users write bills"
  on public.budget_bills for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  );

create policy "budget users read reserves"
  on public.budget_reserves for select
  using (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  );

create policy "budget users write reserves"
  on public.budget_reserves for all
  using (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  )
  with check (
    household_id = public.current_household_id()
    and public.current_profile_budget_access()
  );
