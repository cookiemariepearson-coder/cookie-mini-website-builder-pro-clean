# Cookie Mini Website Builder Pro — Paid Checkout 404 Hard Fix

This update fixes the 404 error when clicking paid checkout.

It adds real checkout pages:

- /checkout/starter
- /checkout/business
- /checkout/premium
- /checkout/extra

Each page safely redirects to the Gumroad URL saved in Vercel Environment Variables.

## Upload instructions

1. Unzip this package.
2. Upload the inside files/folders to the clean GitHub repo only:
   cookie-mini-website-builder-pro-clean
3. Commit changes.
4. Wait for Vercel to say Ready.
5. Test:
   - https://www.cookiesdigitalcreations.com/checkout/starter
   - https://www.cookiesdigitalcreations.com/checkout/business
   - https://www.cookiesdigitalcreations.com/checkout/premium
   - https://www.cookiesdigitalcreations.com/checkout/extra

## Make sure these Vercel variables exist

- NEXT_PUBLIC_STARTER_SUBSCRIPTION_CHECKOUT_URL
- NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL
- NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL
- NEXT_PUBLIC_EXTRA_PAGE_SUBSCRIPTION_CHECKOUT_URL

Each value should be the full Gumroad URL starting with https://
