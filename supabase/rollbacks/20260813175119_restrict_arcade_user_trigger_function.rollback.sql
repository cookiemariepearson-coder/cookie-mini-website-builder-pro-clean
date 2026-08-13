-- Emergency rollback only: restores the previous search_path and direct EXECUTE grants.
alter function public.handle_new_arcade_user() set search_path = public;
grant execute on function public.handle_new_arcade_user() to public, anon, authenticated, service_role;
comment on function public.handle_new_arcade_user() is null;
