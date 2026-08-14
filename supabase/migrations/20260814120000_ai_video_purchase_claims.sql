-- Bind verified standalone AI Video purchases to authenticated customers.
-- No license keys, sale IDs, purchase emails, or provider payloads are stored.

create table if not exists public.ai_video_purchase_claims (
  id uuid primary key default gen_random_uuid(),
  purchase_namespace text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  purchase_email_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_video_purchase_claims_namespace_check
    check (purchase_namespace ~ '^standalone-[a-f0-9]{24}$'),
  constraint ai_video_purchase_claims_email_hash_check
    check (purchase_email_hash ~ '^[a-f0-9]{64}$')
);

create index if not exists ai_video_purchase_claims_owner_id_idx
  on public.ai_video_purchase_claims (owner_id, created_at desc);

alter table public.ai_video_purchase_claims enable row level security;

revoke all on table public.ai_video_purchase_claims from public, anon, authenticated;
grant all on table public.ai_video_purchase_claims to service_role;

comment on table public.ai_video_purchase_claims is
  'Server-only ownership binding for verified standalone AI Video purchases.';
