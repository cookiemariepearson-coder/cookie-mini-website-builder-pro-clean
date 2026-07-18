# Builder Draft + Media + Template Fix

Upload these files to the CLEAN GitHub repo only:

cookie-mini-website-builder-pro-clean

## Important Supabase step

Before testing publish/save draft, run this SQL in the correct Website Builder Supabase project:

supabase/builder_draft_site_column_migration.sql

This fixes the error:

Could not find the 'site' column of 'websites' in the schema cache

## What this update fixes

- Adds Save Draft button and browser auto-save.
- Lets customers return from AI Video Studio without losing their builder draft.
- Adds Back to Builder buttons inside AI Video Studio.
- Adds visible page wording fields for Home, About, Services, Gallery, Portfolio, etc.
- Makes builder preview update as customers enter section wording.
- Adds hero image upload and video/media link fields in Design.
- Adds media upload/link support for gallery-style pages.
- Adds clearer free-plan page limit messaging.
- Improves template design differences with richer industry-specific visual styling.
- Fixes the missing site column publish error once the SQL is run.

After GitHub upload, wait for Vercel Ready and test /builder.
