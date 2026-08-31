-- Restrict this LifeOS instance to a single owner account.
--
-- This is enforced at the database level (a trigger on auth.users), not just
-- in the app UI, so it holds even if someone calls the Supabase REST/auth API
-- directly with the public anon key and bypasses the app entirely.
--
-- Run this once in the Supabase SQL editor (it needs access to the `auth`
-- schema, which the SQL editor has via the postgres role).

create or replace function public.prevent_additional_signups()
returns trigger as $$
begin
  if (select count(*) from auth.users) >= 1 then
    raise exception 'Signups are disabled. This is a private, single-owner instance.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_prevent_additional_signups on auth.users;

create trigger trg_prevent_additional_signups
  before insert on auth.users
  for each row
  execute function public.prevent_additional_signups();

-- To temporarily allow a second signup (e.g. you're resetting your own
-- account), run this first, do the signup, then re-run the block above:
--   drop trigger if exists trg_prevent_additional_signups on auth.users;
