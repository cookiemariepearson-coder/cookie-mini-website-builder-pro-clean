# Cookie Mini Website Builder Pro — AI Video Customer Plan Limits Upgrade

This pack adds real HeyGen video limits by customer plan.

## What it adds

- Free users: creative video kit only
- Starter users: creative video kit only
- Business users: 1 real HeyGen video per month
- Premium users: 3 real HeyGen videos per month
- Owner/admin override using `HEYGEN_VIDEO_ACCESS_CODE` or `ADMIN_PIN`
- Monthly usage tracking in Supabase
- Bonus video credit field
- Admin video credit control page at `/admin/video-credits`
- Customer-facing Video Studio now asks for email or website/subdomain for plan check

## Step 1 — Run Supabase SQL

Run this SQL in the Cookie Mini Website Builder Supabase project:

```text
supabase/ai_video_customer_plan_limits_migration.sql
```

Do not run it in the casino project.

## Step 2 — Upload code

Upload the inside files/folders to the clean GitHub repo only:

```text
cookie-mini-website-builder-pro-clean
```

Commit changes and wait for Vercel to show Ready.

## Step 3 — Optional Vercel variable

Add this to Vercel if you want a separate video access code:

```text
HEYGEN_VIDEO_ACCESS_CODE
```

If you do not add it, the owner override uses your existing `ADMIN_PIN`.

Optional plan limit overrides:

```text
HEYGEN_STARTER_MONTHLY_LIMIT=0
HEYGEN_BUSINESS_MONTHLY_LIMIT=1
HEYGEN_PREMIUM_MONTHLY_LIMIT=3
```

Redeploy after adding or changing environment variables.

## Step 4 — Test

Open:

```text
https://www.cookiesdigitalcreations.com/video-studio
```

Test as admin first using your AI video access code. Then test with a Business or Premium customer email/subdomain.

Open the admin credit controls here:

```text
https://www.cookiesdigitalcreations.com/admin/video-credits
```
