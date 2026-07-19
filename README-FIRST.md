# Cookie Mini Website Builder Pro — Launch Kinks Cleanup Fix

Upload the inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

This update fixes the small launch kinks found in testing:

- Removes the confusing browser “Leave site? Changes may not be saved” popup from the builder.
- Keeps Save Draft / checkout draft saving in place.
- Adds a stronger checkout success page that republishes the saved draft and updates the published slug before showing “Open Published Website.”
- Helps prevent the Starter checkout return from opening a bad/old published link.
- Makes the Gumroad subscription admin page use stacked website cards instead of a wide table, so the last columns/rows are not cut off.
- Adds better admin PIN field autocomplete settings on the subscriptions page.

No new Supabase SQL is needed.

After deploy, test:

1. /builder
2. Save Draft
3. Go to Starter checkout
4. Return to /checkout/success?paid=starter
5. Open Published Website
6. /admin/subscriptions

Important Gumroad check:
Make sure the Starter product return/content link points to:
https://www.cookiesdigitalcreations.com/checkout/success?paid=starter

Use matching links for the others:
https://www.cookiesdigitalcreations.com/checkout/success?paid=business
https://www.cookiesdigitalcreations.com/checkout/success?paid=premium
https://www.cookiesdigitalcreations.com/checkout/success?paid=extra
