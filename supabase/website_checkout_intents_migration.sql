-- Durable, server-authoritative paid website checkout continuation.
create table if not exists public.website_checkout_intents (
  id uuid primary key,
  plan text not null check (plan in ('starter', 'business', 'premium', 'extra')),
  draft_slug text,
  website_id uuid references public.websites(id) on delete set null,
  email_hash text,
  owner_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending_auth' check (status in ('pending_auth', 'ready', 'checkout_started')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  authenticated_at timestamptz,
  checkout_started_at timestamptz,
  constraint website_checkout_intents_draft_slug_check
    check (draft_slug is null or draft_slug ~ '^[a-z0-9-]{1,60}$')
);

alter table public.website_checkout_intents enable row level security;
revoke all on table public.website_checkout_intents from anon, authenticated;
grant all on table public.website_checkout_intents to service_role;

create index if not exists website_checkout_intents_owner_status_idx
  on public.website_checkout_intents (owner_id, status, created_at desc);
create index if not exists website_checkout_intents_email_status_idx
  on public.website_checkout_intents (email_hash, status, created_at desc);
create index if not exists website_checkout_intents_website_id_idx
  on public.website_checkout_intents (website_id);
create index if not exists website_checkout_intents_expires_at_idx
  on public.website_checkout_intents (expires_at);
