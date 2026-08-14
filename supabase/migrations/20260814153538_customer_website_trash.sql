-- Customer-controlled publication state and recoverable website Trash.
-- Content, ownership, billing, entitlement, and audit fields remain on the protected website row.

alter table public.websites
  add column if not exists customer_unpublished_at timestamptz,
  add column if not exists customer_deleted_at timestamptz;

create index if not exists websites_customer_deleted_at_idx
  on public.websites(customer_deleted_at)
  where customer_deleted_at is not null;

comment on column public.websites.customer_unpublished_at is
  'Most recent time the verified customer removed the website from public access.';

comment on column public.websites.customer_deleted_at is
  'Time the verified customer moved the website into protected recoverable Trash; billing and audit records are retained.';
