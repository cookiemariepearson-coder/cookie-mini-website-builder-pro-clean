-- Durable Contact and Done-for-You request records.
-- Safe to run more than once. Service-role access only; no public policies.

create table if not exists public.customer_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text unique not null,
  request_type text not null check (request_type in ('done-for-you', 'contact')),
  service text,
  customer_name text not null,
  business_name text,
  business_type text,
  customer_email text not null,
  phone text,
  preferred_contact text,
  customer_action text,
  details text not null,
  checkout_required boolean not null default false,
  checkout_configured boolean not null default false,
  notification_status text not null default 'pending',
  admin_provider_message_id text,
  customer_provider_message_id text,
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_requests_type_created_idx
  on public.customer_requests(request_type, created_at desc);
create index if not exists customer_requests_email_idx
  on public.customer_requests(customer_email);
create index if not exists customer_requests_notification_idx
  on public.customer_requests(notification_status, created_at desc);

alter table public.customer_requests enable row level security;
revoke all on table public.customer_requests from anon, authenticated;
