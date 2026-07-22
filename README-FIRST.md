# Cookie Mini Website Builder Pro - Plan Accuracy Module Path Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

The previous Plan Accuracy pack had two old policy redirect files using the wrong relative import path.

Vercel error:
Module not found: Can't resolve '../../legal/ai-video/page'

Correct path:
../legal/ai-video/page

This small patch fixes:

- app/ai-video-policy/page.js
- app/subscription-policy/page.js

## No SQL needed

This is only a build/import path fix.

## Test after Vercel is Ready

https://www.cookiesdigitalcreations.com/ai-video-policy
https://www.cookiesdigitalcreations.com/subscription-policy
https://www.cookiesdigitalcreations.com/legal/ai-video
https://www.cookiesdigitalcreations.com/legal/subscription
https://www.cookiesdigitalcreations.com/builder
https://www.cookiesdigitalcreations.com/pricing
