-- Run only if the prepared redundant-index removal is later authorized,
-- applied, and must be reversed.

create index concurrently if not exists websites_owner_idx
  on public.websites using btree (owner_id);
