-- Cookie Mini Website Builder Pro - HeyGen Video Results Dashboard
-- Run in the Cookie Mini Website Builder Supabase project. Safe to run more than once.

create table if not exists public.heygen_video_jobs (
  id uuid primary key default gen_random_uuid(),
  website_id text null,
  customer_email text,
  website_slug text,
  business_name text,
  prompt text,
  status text default 'generating',
  plan text,
  owner_override boolean default false,
  video_type text,
  platform text,
  heygen_session_id text,
  heygen_video_id text,
  video_url text,
  thumbnail_url text,
  duration numeric,
  failure_code text,
  failure_message text,
  raw_response jsonb,
  created_at timestamptz default now(),
  checked_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists heygen_video_jobs_email_idx on public.heygen_video_jobs(customer_email);
create index if not exists heygen_video_jobs_slug_idx on public.heygen_video_jobs(website_slug);
create index if not exists heygen_video_jobs_session_idx on public.heygen_video_jobs(heygen_session_id);
create index if not exists heygen_video_jobs_video_idx on public.heygen_video_jobs(heygen_video_id);
create index if not exists heygen_video_jobs_created_idx on public.heygen_video_jobs(created_at desc);
