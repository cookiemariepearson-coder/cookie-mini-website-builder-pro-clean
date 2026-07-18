-- Cookie Mini Website Builder Pro Clean
-- Builder Draft + Site JSON Column Migration
-- Run this in the CORRECT Supabase project for Cookie Mini Website Builder Pro, not the casino project.
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  customer_email text,
  business_name text,
  plan text default 'free',
  status text default 'draft',
  extra_pages integer default 0,
  monthly_price integer default 0,
  admin_notes text default '',
  site jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.websites add column if not exists customer_email text;
alter table public.websites add column if not exists business_name text;
alter table public.websites add column if not exists plan text default 'free';
alter table public.websites add column if not exists status text default 'draft';
alter table public.websites add column if not exists extra_pages integer default 0;
alter table public.websites add column if not exists monthly_price integer default 0;
alter table public.websites add column if not exists admin_notes text default '';
alter table public.websites add column if not exists site jsonb default '{}'::jsonb;
alter table public.websites add column if not exists created_at timestamptz default now();
alter table public.websites add column if not exists updated_at timestamptz default now();

create index if not exists websites_slug_idx on public.websites(slug);
create index if not exists websites_status_idx on public.websites(status);
create index if not exists websites_customer_email_idx on public.websites(customer_email);
create index if not exists websites_updated_at_idx on public.websites(updated_at);

alter table public.websites enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='websites' and policyname='Public can read published websites') then
    create policy "Public can read published websites" on public.websites for select using (status = 'published');
  end if;
end $$;

-- Ask Supabase/PostgREST to refresh the schema cache so the app sees the new 'site' column.
notify pgrst, 'reload schema';
