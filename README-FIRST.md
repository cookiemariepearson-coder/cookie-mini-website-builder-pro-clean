# Cookie Mini Website Builder Pro - AI Video Customer View Cleanup + Status Sync Fix

Upload these files to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

- Hides "Open in HeyGen" from customers.
- Keeps the HeyGen troubleshooting link owner-only.
- Shows generated videos inside your own site.
- Adds Download MP4 and Copy Video Link options.
- Hides the owner/admin access code box unless Owner Test Mode is opened.
- Adds Refresh Video Status to the saved results page.
- Updates old stuck processing videos when HeyGen returns a completed video URL.
- Shows completed videos first.

## Supabase

No new SQL is needed if you already ran:

supabase/heygen_video_results_migration.sql

If /video-studio/results says the table does not exist, run that migration again in the Cookie Mini Website Builder Supabase project.

## Test after Vercel is Ready

https://www.cookiesdigitalcreations.com/video-studio
https://www.cookiesdigitalcreations.com/video-studio/results

Test with one old processing video and click Refresh Video Status.
