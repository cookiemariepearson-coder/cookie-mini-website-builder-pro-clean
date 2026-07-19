# Cookie Mini Website Builder Pro — Mobile Preview + HeyGen Results Upgrade

Upload the inside files/folders to the **clean GitHub repo only**:

`cookie-mini-website-builder-pro-clean`

## What this upgrade adds

- Mobile builder preview drawer.
- Sticky **Open Live Preview** button on mobile.
- Desktop builder preview stays side-by-side.
- HeyGen video jobs save to Supabase.
- New customer video results page:

`https://www.cookiesdigitalcreations.com/video-studio/results`

- AI Video Studio includes a button to open the results dashboard.
- HeyGen status checks update the saved video record when the MP4 is ready.

## Supabase step

Run this SQL once in the **Cookie Mini Website Builder Supabase project**:

`supabase/heygen_video_results_migration.sql`

This creates the table for saved HeyGen video results.

## Test after Vercel says Ready

1. Open `/builder` on your phone or narrow browser.
2. Confirm **Open Live Preview** opens the preview without scrolling all the way down.
3. Close preview and keep editing.
4. Open `/video-studio` and create/check a HeyGen video.
5. Open `/video-studio/results` and search by email or website/subdomain.
6. Confirm finished videos play inside your site.

No new Vercel environment variables are required.
