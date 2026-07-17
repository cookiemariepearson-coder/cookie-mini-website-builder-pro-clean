-- Cookie Mini Website Builder Pro - Admin Plan Management migration
-- Run this in Supabase SQL Editor. Safe to run more than once.

alter table public.websites add column if not exists admin_notes text default '';
alter table public.websites add column if not exists monthly_price integer default 0;
alter table public.websites add column if not exists extra_pages integer default 0;
alter table public.websites add column if not exists plan text default 'free';
alter table public.websites add column if not exists status text default 'published';
alter table public.websites add column if not exists customer_email text;
alter table public.websites add column if not exists business_name text;
alter table public.websites add column if not exists updated_at timestamptz default now();

create index if not exists websites_plan_idx on public.websites(plan);
create index if not exists websites_updated_at_idx on public.websites(updated_at);
