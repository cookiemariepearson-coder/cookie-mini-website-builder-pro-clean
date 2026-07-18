# Cookie Mini Website Builder Pro - Builder Stability + Template + Media Fix

Upload these files to the CLEAN GitHub repo only:

cookie-mini-website-builder-pro-clean

This update focuses on the builder glitches reported during the Free Launch Page test.

## Fixes included

- Reduces freezing while typing and editing by slowing autosave and using a deferred preview.
- Keeps browser draft saving, but prevents constant heavy saves while customers type.
- Compresses uploaded hero/gallery images before saving so the builder does not lock up as easily.
- Makes gallery/media uploading more visible with separate buttons:
  - Add Uploaded Image
  - Add Video / Media Link
- Lets customers choose which section a media item belongs to: Gallery, Portfolio, Projects, Before & After, Products, or Menu.
- Template changes from the Design page now apply immediately and update preview colors/art style.
- Design page now includes both Website Type and Template Look choices.
- Adds stronger visual differences across template looks.
- Keeps Save Draft, AI Video Studio return, Free Launch Page limits, checkout routes, and Supabase publish flow.

## Supabase

If you still see a missing `site` column error when publishing, run:

supabase/builder_draft_site_column_migration.sql

Run it in the Website Builder Supabase project, not the casino project.

## Test flow

1. Open /builder
2. Start Free Launch Page
3. Enter website info
4. Change Design template/look
5. Upload hero image
6. Add Gallery media image and media link
7. Click Save Draft
8. Open AI Video Studio
9. Return to builder
10. Confirm draft still exists
11. Publish Free Page
