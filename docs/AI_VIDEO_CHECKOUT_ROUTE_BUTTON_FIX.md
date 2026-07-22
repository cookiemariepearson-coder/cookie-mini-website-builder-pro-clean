# Cookie Mini Website Builder Pro - AI Video Checkout Route Button Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

The AI Video Studio banner button opened the $5 AI Video Studio checkout page, but that page did not have a clear button to continue into the studio.

This fix adds clear buttons on:

/checkout/ai-video

Buttons added:

- Start AI Video Studio — $5
- Already Purchased / Open Studio
- View Website Plans
- Build a Website Instead

## How it works

If this Vercel Environment Variable exists:

NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL

Then the main button routes to your real Gumroad checkout link.

If that variable is missing, the page still shows:

Open AI Video Studio

This allows owner testing and soft-launch review without getting stuck on the checkout page.

## To connect the real $5 checkout

In Vercel:

1. Open cookie-mini-website-builder-pro-clean
2. Go to Settings
3. Go to Environment Variables
4. Add or confirm:

Name:
NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL

Value:
Your Gumroad AI Video Studio checkout link

5. Save
6. Redeploy

## No SQL needed

This is only a checkout page button/route fix.

## Test after Vercel says Ready

Open:

https://www.cookiesdigitalcreations.com/checkout/ai-video

Confirm you see:

- Start AI Video Studio — $5
- Already Purchased / Open Studio
- View Website Plans
- Build a Website Instead

Then click:

Already Purchased / Open Studio

It should open:

/video-studio?mode=standalone
