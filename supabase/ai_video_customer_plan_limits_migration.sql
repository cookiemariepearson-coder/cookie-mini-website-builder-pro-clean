-- Cookie Mini Website Builder Pro
-- AI Video Customer Plan Limits Migration
-- Run this in the Cookie Mini Website Builder Supabase project, not the casino project.

alter table public.websites
  add column if not exists video_month_key text,
  add column if not exists video_usage_month integer default 0,
  add column if not exists video_bonus_credits integer default 0,
  add column if not exists video_lifetime_count integer default 0,
  add column if not exists last_video_at timestamptz,
  add column if not exists last_video_status text,
  add column if not exists last_heygen_session_id text,
  add column if not exists last_heygen_video_id text;

create index if not exists websites_video_month_idx on public.websites(video_month_key);
create index if not exists websites_video_usage_idx on public.websites(video_usage_month);
