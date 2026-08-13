-- Keep the Joy House Arcade auth trigger while preventing direct Data API/RPC calls.
create or replace function public.handle_new_arcade_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  base_username text;
  final_username text;
begin
  base_username := pg_catalog.lower(
    pg_catalog.regexp_replace(
      pg_catalog.coalesce(new.raw_user_meta_data->>'username', pg_catalog.split_part(new.email, '@', 1), 'player'),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );
  if pg_catalog.char_length(base_username) < 3 then
    base_username := 'player';
  end if;
  base_username := pg_catalog.left(base_username, 18);
  final_username := base_username || '_' || pg_catalog.substr(pg_catalog.replace(new.id::text, '-', ''), 1, 5);

  insert into public.arcade_profiles(id, username, display_name)
  values(
    new.id,
    final_username,
    pg_catalog.coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', 'Cookie Player')
  )
  on conflict (id) do nothing;

  insert into public.arcade_wallets(user_id, coins)
  values(new.id, 0)
  on conflict (user_id) do nothing;

  insert into public.arcade_progress(user_id)
  values(new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

revoke all on function public.handle_new_arcade_user() from public;
revoke execute on function public.handle_new_arcade_user() from anon, authenticated, service_role;
grant execute on function public.handle_new_arcade_user() to supabase_auth_admin;

comment on function public.handle_new_arcade_user() is
  'Internal auth.users trigger for Joy House Arcade provisioning; direct Data API execution is denied.';
