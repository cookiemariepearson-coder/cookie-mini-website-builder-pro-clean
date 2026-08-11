-- Cookie Mini Website Builder Pro — guest draft claims and explicit owner RLS
-- Guest claim rows are server-only. Browser clients never receive table grants.

create table if not exists public.guest_draft_claims (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  draft_slug text not null check (draft_slug ~ '^[a-z0-9-]{1,60}$'),
  site jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'claiming', 'claimed')),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  claimed_at timestamptz
);

create index if not exists guest_draft_claims_expires_at_idx
  on public.guest_draft_claims(expires_at);
create index if not exists guest_draft_claims_claimed_by_idx
  on public.guest_draft_claims(claimed_by);

alter table public.guest_draft_claims enable row level security;
revoke all on table public.guest_draft_claims from anon, authenticated;

-- Keep website access explicit: authentication and row ownership are both required.
alter table public.websites enable row level security;
drop policy if exists "Owners can insert own websites" on public.websites;
drop policy if exists "Owners can read own websites" on public.websites;
drop policy if exists "Owners can update own websites" on public.websites;

create policy "Owners can insert own websites"
on public.websites for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners can read own websites"
on public.websites for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can update own websites"
on public.websites for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

