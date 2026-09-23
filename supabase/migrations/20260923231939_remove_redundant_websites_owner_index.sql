-- PREPARED ONLY — DO NOT APPLY WITHOUT OWNER AUTHORIZATION.
-- public.websites retains websites_owner_id_idx on owner_id for owner-scoped
-- RLS and lookup paths. Live read-only verification on 2026-09-23 confirmed
-- this index is valid, non-unique, constraint-free, and actively used, while
-- websites_owner_idx is an equivalent unused index with no dependents.

drop index concurrently if exists public.websites_owner_idx;

-- Manual rollback:
-- create index concurrently websites_owner_idx
--   on public.websites using btree (owner_id);
