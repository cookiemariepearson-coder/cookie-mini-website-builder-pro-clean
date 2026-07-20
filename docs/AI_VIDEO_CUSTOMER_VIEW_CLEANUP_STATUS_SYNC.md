# AI Video Customer View Cleanup + Status Sync Fix

This upgrade cleans up the customer-facing AI Video Studio experience.

## What changed

- Customers stay on the Cookie Mini Website Builder site to watch their video.
- The customer view shows **Download MP4**, **Copy Video Link**, and an embedded video player.
- The **Open in HeyGen** button is hidden from customers and only appears inside owner test mode for troubleshooting.
- The owner/admin access code box is hidden inside a collapsible **Owner/admin testing only** section.
- Saved video results now have a **Refresh Video Status** button.
- Old videos stuck on “processing” can be refreshed and updated when HeyGen returns a video URL.
- Completed videos are shown first on the results page.

## Test pages

- /video-studio
- /video-studio/results

No new Supabase SQL is required if the HeyGen results migration was already run.
