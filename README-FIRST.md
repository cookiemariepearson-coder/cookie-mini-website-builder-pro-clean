# Cookie Mini Website Builder Pro - Clean Pricing + Standalone AI Video Button Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

- Cleans the pricing page so the plan list is not duplicated.
- Removes customer-facing wording about the internal fixes.
- Organizes the pricing page into one clean plan grid.
- Adds an AI Video Studio button on the landing/home page.
- Adds a separate AI Video Studio checkout route at:

/checkout/ai-video

- Adds AI Video Studio to the pricing page as a separate $5 option for customers who do not need a website.
- Updates checkout success so:

/checkout/success?paid=ai-video

does not look for a website draft and instead sends the customer to AI Video Studio.
- Allows AI Video Studio to recognize a standalone AI video pass on the device after checkout.
- Updates the AI Video policy to mention the standalone AI Video option.

## Important Gumroad setup needed

Create a new Gumroad product:

Product name:
AI Video Studio

Price:
$5

Recommended return URL:
https://www.cookiesdigitalcreations.com/checkout/success?paid=ai-video

After creating the Gumroad product, copy its checkout link and add it to Vercel Environment Variables:

NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL

Then redeploy.

## How it affects Free and Starter

It does not change the Free Launch Page or Starter Pro pricing.

Free Launch Page stays:
$0

Starter Pro stays:
$19/month

Business stays:
$30/month

Premium stays:
$50/month

Extra Page Add-On stays:
$10/month per page

The $5 AI Video Studio product is a separate optional purchase for people who want video help without buying a website plan.

## No Supabase SQL needed

This is a page, checkout route, AI Video Studio, and policy wording update.

## Test after Vercel is Ready

https://www.cookiesdigitalcreations.com/
https://www.cookiesdigitalcreations.com/pricing
https://www.cookiesdigitalcreations.com/checkout/ai-video
https://www.cookiesdigitalcreations.com/checkout/success?paid=ai-video
https://www.cookiesdigitalcreations.com/video-studio?mode=standalone
https://www.cookiesdigitalcreations.com/legal/ai-video
