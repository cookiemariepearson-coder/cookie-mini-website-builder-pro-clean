# Cookie Mini Website Builder Pro - Template Look Switch + Publish 404 Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

### Template look switching

Some pairs were still too close, especially:

- Beauty / Hair / Salon
- Nonprofit / Community
- Kids / Party / Fun

This fix makes those style pairs visibly different.

Beauty:
- Floral Glam is now softer, floral, pink/gold, and bright.
- Luxury Salon is now darker, richer, purple/gold, and premium.

Nonprofit:
- Warm Mission is now warm, soft, and community-style.
- Bold Action is now stronger, diagonal, action-focused, and high contrast.

Kids:
- Cartoon Bright is now playful pink/purple party style.
- Color Pop is now bold split-color, brighter, and more graphic.

Portfolio:
- Cinematic is now darker and moodier so it is not too bright.
- Cartoon Creative stays bright and playful.

### Published website 404

This also fixes:

- Open Published Website going to 404
- Open Backup Preview going to 404

It adds:

- app/site/[slug]/page.js
- middleware.js

The middleware rewrites customer subdomains like:

customername.cookiesdigitalcreations.com

to:

/site/customername

The backup preview route also works at:

/site/customername

## No SQL needed

This is template CSS + published route + middleware only.

## Test after Vercel says Ready

Test template look switching:

1. Open Builder.
2. Choose Beauty / Hair / Salon.
3. Switch between Floral Glam and Luxury Salon.
4. Confirm they look very different.
5. Choose Nonprofit / Community.
6. Switch between Warm Mission and Bold Action.
7. Confirm they look very different.
8. Choose Kids / Party / Fun.
9. Switch between Cartoon Bright and Color Pop.
10. Confirm they look very different.
11. Choose Portfolio / Film / Creator.
12. Confirm Cinematic is dark and not too bright.

Test published routes:

1. Publish a test site.
2. Click Open Published Website.
3. Click Open Backup Preview.
4. Both should open instead of 404.
