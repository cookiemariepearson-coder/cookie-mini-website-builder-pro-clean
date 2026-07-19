# Cookie Mini Website Builder Pro — Gumroad Subscription Status + Website Access Control

Upload this package to the CLEAN GitHub repo only:

`cookie-mini-website-builder-pro-clean`

## Before upload / after upload steps

1. Run Supabase SQL:
   `supabase/gumroad_subscription_status_access_migration.sql`

2. Upload the inside files/folders to GitHub.

3. Add this Vercel environment variable:
   `GUMROAD_ACCESS_TOKEN`

4. Redeploy Vercel.

5. Open:
   `https://www.cookiesdigitalcreations.com/admin/subscriptions`

6. Enter admin PIN and click:
   **Register Gumroad Webhooks**

## What this adds

- Gumroad webhook receiver at `/api/gumroad/webhook`
- Owner setup endpoint for Gumroad resource subscriptions
- Admin subscription dashboard at `/admin/subscriptions`
- Supabase logging table: `gumroad_events`
- Website fields for subscription status and access status
- Auto-pause for canceled/ended/refunded/disputed paid sites
- Manual admin override for subscription/access/status

## Do not touch

- IONOS
- Vercel domain settings
- Supabase keys already working
- HeyGen key
- Gumroad checkout links
