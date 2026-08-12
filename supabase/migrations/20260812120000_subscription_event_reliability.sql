-- Cookie Mini Website Builder Pro — verified subscription lifecycle and event review.
-- All webhook and reconciliation writes are server-only through the service role.

alter table public.websites add column if not exists subscription_started_at timestamptz;
alter table public.websites add column if not exists subscription_next_renewal_at timestamptz;
alter table public.websites add column if not exists subscription_end_at timestamptz;
alter table public.websites add column if not exists subscription_failed_at timestamptz;
alter table public.websites add column if not exists subscription_state_event_at timestamptz;
alter table public.websites add column if not exists subscription_state_before_review text;
alter table public.websites add column if not exists site_status_before_billing_hold text;
alter table public.websites add column if not exists gumroad_last_event_key text;
alter table public.websites add column if not exists extra_page_gumroad_sale_id text;
alter table public.websites add column if not exists extra_page_gumroad_subscription_id text;
alter table public.websites add column if not exists extra_page_gumroad_product_id text;
alter table public.websites add column if not exists extra_page_subscription_end_at timestamptz;
alter table public.websites add column if not exists extra_page_state_event_at timestamptz;
alter table public.websites add column if not exists extra_page_last_event_at timestamptz;

alter table public.gumroad_events add column if not exists provider_event_id text;
alter table public.gumroad_events add column if not exists event_category text;
alter table public.gumroad_events add column if not exists provider_event_at timestamptz;
alter table public.gumroad_events add column if not exists received_at timestamptz;
alter table public.gumroad_events add column if not exists processing_status text not null default 'processed';
alter table public.gumroad_events add column if not exists review_status text not null default 'unresolved';
alter table public.gumroad_events add column if not exists review_reason text;
alter table public.gumroad_events add column if not exists safe_action text;
alter table public.gumroad_events add column if not exists internal_note text;
alter table public.gumroad_events add column if not exists retry_count integer not null default 0;
alter table public.gumroad_events add column if not exists last_reconciled_at timestamptz;
alter table public.gumroad_events add column if not exists reconciliation_source text;
alter table public.gumroad_events add column if not exists applied boolean not null default false;
alter table public.gumroad_events add column if not exists error_code text;
alter table public.gumroad_events add column if not exists reviewed_at timestamptz;
alter table public.gumroad_events add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

update public.gumroad_events
set provider_event_id = coalesce(provider_event_id, event_key),
    event_category = coalesce(event_category, resource_name, 'unknown'),
    received_at = coalesce(received_at, processed_at, now()),
    provider_event_at = coalesce(provider_event_at, processed_at, now()),
    processing_status = 'processed',
    review_status = case when action_taken like 'matched_%' then 'resolved' else 'unresolved' end,
    applied = action_taken like 'matched_%'
where provider_event_id is null;

create unique index if not exists gumroad_events_provider_event_id_unique
  on public.gumroad_events(provider_event_id) where provider_event_id is not null;
create unique index if not exists websites_gumroad_subscription_id_unique
  on public.websites(gumroad_subscription_id) where gumroad_subscription_id is not null;
create unique index if not exists websites_extra_page_subscription_id_unique
  on public.websites(extra_page_gumroad_subscription_id) where extra_page_gumroad_subscription_id is not null;
create index if not exists gumroad_events_review_queue_idx
  on public.gumroad_events(review_status, received_at desc);
create index if not exists gumroad_events_subscription_id_idx
  on public.gumroad_events(subscription_id) where subscription_id is not null;

alter table public.gumroad_events enable row level security;
revoke all on table public.gumroad_events from anon, authenticated, service_role;
grant select, insert, update on table public.gumroad_events to service_role;
revoke all on sequence public.gumroad_events_id_seq from anon, authenticated, service_role;
grant usage, select on sequence public.gumroad_events_id_seq to service_role;
