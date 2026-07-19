# AI Video Customer Plan Limits

This pack protects the HeyGen real-video generator by checking a customer website plan before creating a real video.

## Included limits

- Free: creative kit only, no real HeyGen video
- Starter Pro: creative kit only, no real HeyGen video
- Business: 1 real HeyGen video per month
- Premium: 3 real HeyGen videos per month
- Owner/Admin: can override using `HEYGEN_VIDEO_ACCESS_CODE` or `ADMIN_PIN`

## Optional Vercel variables

You can leave these alone if you like the default limits:

```text
HEYGEN_STARTER_MONTHLY_LIMIT=0
HEYGEN_BUSINESS_MONTHLY_LIMIT=1
HEYGEN_PREMIUM_MONTHLY_LIMIT=3
HEYGEN_VIDEO_ACCESS_CODE=your-private-video-test-code
```

`HEYGEN_VIDEO_ACCESS_CODE` is recommended so the AI video access code is not the same as your admin PIN.

## Admin credit controls

After uploading this pack, open:

```text
/admin/video-credits
```

You can look up a customer by email, short website name, or full subdomain, then:

- See their current video usage
- Set bonus credits
- Reset monthly usage

## Notes

This is not full Gumroad subscription verification yet. It uses the plan/status saved on the website record in Supabase. Use the admin dashboard to keep customer plan/status accurate until a future Gumroad webhook upgrade is added.
