# Cookie Mini Website Builder Pro - AI Video Checkout No Auto Redirect Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

The AI Video checkout page was opening and then jumping to a 404 page because the page was set to auto-redirect after loading.

This patch removes the automatic jump.

Now /checkout/ai-video:

- Opens normally.
- Shows the AI Video Studio $5 checkout page.
- Shows a Continue to AI Video Checkout button only when the Gumroad link is connected.
- Does not force customers away from the page automatically.
- Prevents a wrong/missing checkout link from pushing users to a 404 page.

## No SQL needed

This is only a checkout page behavior fix.

## Vercel Environment Variable

Make sure this variable is set after the Gumroad AI Video Studio product is ready:

NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL

Value should be your Gumroad AI Video Studio product or checkout URL.
It should begin with https://

## Test after Vercel says Ready

https://www.cookiesdigitalcreations.com/checkout/ai-video

The page should stay open and should not jump to 404.

Then test:

https://www.cookiesdigitalcreations.com/checkout/success?paid=ai-video
https://www.cookiesdigitalcreations.com/video-studio?mode=standalone
