-- Cookie Mini Website Builder Pro
-- Gumroad Subscription Status + Website Access Control Migration
-- Run this in the Cookie Mini Website Builder Supabase project.

alter table public.websites add column if not exists subscription_status text default 'unverified';
alter table public.websites add column if not exists access_status text default 'active';
alter table public.websites add column if not exists payment_provider text default 'gumroad';
alter table public.websites add column if not exists gumroad_email text;
alter table public.websites add column if not exists gumroad_sale_id text;
alter table public.websites add column if not exists gumroad_subscription_id text;
alter table public.websites add column if not exists gumroad_product_id text;
alter table public.websites add column if not exists gumroad_product_name text;
alter table public.websites add column if not exists gumroad_last_event text;
alter table public.websites add column if not exists gumroad_last_event_at timestamptz;
alter table public.websites add column if not exists last_payment_at timestamptz;
alter table public.websites add column if not exists canceled_at timestamptz;
alter table public.websites add column if not exists paused_reason text;
alter table public.websites add column if not exists extra_page_subscription_status text default 'none';
alter table public.websites add column if not exists admin_notes text;

create table if not exists public.gumroad_events (
  id bigserial primary key,
  event_key text unique,
  resource_name text,
  email text,
  sale_id text,
  subscription_id text,
  product_id text,
  product_name text,
  matched_slug text,
  matched_plan text,
  action_taken text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz default now()
);

create index if not exists gumroad_events_email_idx on public.gumroad_events(email);
create index if not exists gumroad_events_slug_idx on public.gumroad_events(matched_slug);
create index if not exists gumroad_events_resource_idx on public.gumroad_events(resource_name);
create index if not exists websites_gumroad_email_idx on public.websites(gumroad_email);
create index if not exists websites_customer_email_idx on public.websites(customer_email);
create index if not exists websites_subscription_status_idx on public.websites(subscription_status);
create index if not exists websites_access_status_idx on public.websites(access_status);

-- Keep public read policy limited to active/published sites if RLS is used.
-- Service role access from Vercel can still update these records.
