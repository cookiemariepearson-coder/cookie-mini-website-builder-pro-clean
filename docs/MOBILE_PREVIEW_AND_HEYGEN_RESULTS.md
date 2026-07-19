# Mobile Preview + HeyGen Video Results Upgrade

This upgrade adds two launch-ready improvements:

1. Mobile builder preview drawer
   - On smaller screens, the live preview is hidden from the long scroll layout.
   - Customers can tap **Open Live Preview** to view the site in a full-screen drawer.
   - Closing the preview returns them to the same builder step.
   - Checkout, drafts, Supabase, and templates are not changed.

2. HeyGen video results dashboard
   - Real HeyGen video jobs are saved to Supabase.
   - Customers can find created videos at `/video-studio/results` by email or website/subdomain.
   - Ready videos play inside your site with a video player.
   - The existing creative kit and HeyGen generation flow stay in place.

Run `supabase/heygen_video_results_migration.sql` once in the Cookie Mini Website Builder Supabase project before testing the results dashboard.
