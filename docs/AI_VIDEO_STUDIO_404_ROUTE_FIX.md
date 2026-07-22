# Cookie Mini Website Builder Pro - AI Video Studio 404 Route Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

The AI Video checkout page button existed, but clicking it went to a 404 page.

This fix adds the missing route:

app/video-studio/page.js

It also updates the checkout page buttons to point to:

/video-studio

instead of relying only on:

/video-studio?mode=standalone

## Buttons fixed

On /checkout/ai-video:

- Open AI Video Studio
- Already Purchased / Open Studio

Both route to:

/video-studio

## No SQL needed

This is only a missing route/page fix.

## Test after Vercel says Ready

Open:

https://www.cookiesdigitalcreations.com/checkout/ai-video

Click:

Already Purchased / Open Studio

It should open:

https://www.cookiesdigitalcreations.com/video-studio

Also test directly:

https://www.cookiesdigitalcreations.com/video-studio
