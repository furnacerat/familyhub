create or replace function public.create_household_invite(
  invite_email text,
  invite_role text,
  invite_budget_access boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_profile public.profiles;
  new_token uuid;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to create an invite';
  end if;

  if invite_role not in ('adult', 'member', 'child') then
    raise exception 'Invalid invite role';
  end if;

  select * into owner_profile
  from public.profiles
  where id = auth.uid()
  limit 1;

  if owner_profile.id is null or owner_profile.role <> 'owner' then
    raise exception 'Only household owners can create invites';
  end if;

  insert into public.household_invites (
    household_id,
    email,
    role,
    budget_access,
    created_by
  )
  values (
    owner_profile.household_id,
    lower(trim(invite_email)),
    invite_role,
    invite_budget_access and invite_role = 'adult',
    auth.uid()
  )
  returning token into new_token;

  return new_token;
end;
$$;
