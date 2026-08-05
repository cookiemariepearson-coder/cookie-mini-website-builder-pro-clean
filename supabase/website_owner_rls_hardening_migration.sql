-- Cookie Mini Website Builder Pro — website ownership + RLS hardening
-- Run once in the Website Builder Supabase SQL Editor after customer email sign-in is enabled.

alter table public.websites add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists websites_owner_id_idx on public.websites(owner_id);

-- Safely attach existing records to the matching Supabase Auth user by email.
update public.websites as website
set owner_id = auth_user.id
from auth.users as auth_user
where website.owner_id is null
  and website.customer_email is not null
  and lower(website.customer_email) = lower(auth_user.email);

alter table public.websites enable row level security;

-- The Builder uses authenticated server routes with the service role; browser clients
-- receive no direct table privileges. This protects drafts, customer emails, billing
-- details, private notes, and webhook payloads if a public key is ever exposed.
revoke all on table public.websites from anon, authenticated;

do $$
begin
  if to_regclass('public.gumroad_events') is not null then
    alter table public.gumroad_events enable row level security;
    revoke all on table public.gumroad_events from anon, authenticated;
  end if;
end $$;

drop policy if exists "Public can read published websites" on public.websites;
