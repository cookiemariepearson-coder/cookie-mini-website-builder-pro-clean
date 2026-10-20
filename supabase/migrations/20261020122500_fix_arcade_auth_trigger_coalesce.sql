-- Fix auth.users provisioning failure during Supabase Auth link generation.
-- COALESCE is SQL syntax, not a callable pg_catalog function. The qualified calls
-- pg_catalog.coalesce(...) caused SQLSTATE 42883 and aborted new-user creation,
-- which surfaced as HTTP 500 from /admin/generate_link.
-- Keep the existing trigger behavior, SECURITY DEFINER posture, empty search_path,
-- and restricted execution grants unchanged.

CREATE OR REPLACE FUNCTION public.handle_new_arcade_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  base_username text;
  final_username text;
BEGIN
  base_username := pg_catalog.lower(
    pg_catalog.regexp_replace(
      COALESCE(new.raw_user_meta_data->>'username', pg_catalog.split_part(new.email, '@', 1), 'player'),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );

  IF pg_catalog.char_length(base_username) < 3 THEN
    base_username := 'player';
  END IF;
  base_username := pg_catalog.left(base_username, 18);
  final_username := base_username || '_' || pg_catalog.substr(pg_catalog.replace(new.id::text, '-', ''), 1, 5);

  INSERT INTO public.arcade_profiles(id, username, display_name)
  VALUES (
    new.id,
    final_username,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', 'Cookie Player')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.arcade_wallets(user_id, coins)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.arcade_progress(user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_arcade_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_arcade_user() FROM anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_arcade_user() TO supabase_auth_admin;

COMMENT ON FUNCTION public.handle_new_arcade_user() IS
  'Internal auth.users trigger for Joy House Arcade provisioning; direct Data API execution is denied.';
