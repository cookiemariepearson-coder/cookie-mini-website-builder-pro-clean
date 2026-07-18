# Cookie Mini Website Builder Pro — Build Ahead Stability Pack 4

Upload this package to the CLEAN GitHub repo only:

cookie-mini-website-builder-pro-clean

This is an all-in-one build-ahead patch that combines the latest working pieces and adds another round of stability polish.

## What this includes

- Builder glitch polish from the latest working builder package
- Paid checkout routes kept active:
  - /checkout/starter
  - /checkout/business
  - /checkout/premium
  - /checkout/extra
- Customer dashboard draft search kept active
- Admin PIN gate / admin plan management files included
- Browser draft backup library added so more than one draft can be recovered from the same browser
- Current draft address shown in the builder sidebar
- Drafts are saved to local browser backup plus Supabase when online saving works
- AI Video Studio return flow kept
- Media upload/link support kept
- More template design CSS polish kept

## Supabase SQL

You do not need to run SQL again if these migrations already succeeded:

- supabase/builder_draft_site_column_migration.sql
- supabase/builder_drafts_customer_dashboard_migration.sql
- supabase/admin_pin_cleanup_archive_migration.sql

Only run them again if you see errors about missing columns like:

- site column missing
- admin_notes missing
- archived_at missing

## Upload instructions

1. Unzip this file.
2. Go to GitHub repo: cookie-mini-website-builder-pro-clean
3. Upload the inside files and folders.
4. Commit changes.
5. Wait for Vercel clean project to say Ready.
6. Test:
   - /builder
   - /customer
   - /admin
   - /checkout/starter
   - /checkout/business
   - /checkout/premium
   - /checkout/extra
   - /video-studio

## Important

Do not upload this to the old repo.
Do not change IONOS, Vercel domains, Gumroad links, or Supabase keys.
