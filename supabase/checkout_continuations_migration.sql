-- Short-lived, server-only recovery for paid checkout after email authentication.
create table if not exists public.checkout_continuations (
  email_hash text primary key,
  return_path text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.checkout_continuations enable row level security;
revoke all on table public.checkout_continuations from anon, authenticated;
grant all on table public.checkout_continuations to service_role;

create index if not exists checkout_continuations_expires_at_idx
  on public.checkout_continuations (expires_at);
