# Cookie Mini Website Builder Pro - Builder Glitch Polish Fix

Upload these inside files/folders to the CLEAN GitHub repo only:

cookie-mini-website-builder-pro-clean

This update continues the builder fixes and keeps the working checkout, customer dashboard, and AI Video Studio flow.

## Fixes included

- Slower autosave to reduce freezing while typing.
- Smaller/compressed image saving for hero and gallery uploads.
- Clearer media upload area for Gallery, Portfolio, Projects, Before & After, Products, and Menu.
- Quick media uploader with section selector.
- Template switching updates the preview immediately.
- More design controls on the Design page:
  - page layout
  - font feel
  - background feel
  - section/card style
  - colors
  - hero image
  - video/media link
- All page wording boxes are visible in one place.
- Drafts still save and can be opened from My Website.
- AI Video Studio return flow is kept.
- Paid checkout routes are kept.

## Important

No new Supabase SQL is required if you already ran the draft/dashboard migrations.

If publish/draft saving complains about the `site` column, run this again in the Website Builder Supabase project:

supabase/builder_draft_site_column_migration.sql

