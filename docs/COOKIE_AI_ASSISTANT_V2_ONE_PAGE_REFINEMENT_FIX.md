# Cookie AI Assistant v2 - One Page Refinement Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

Cookie AI recommended Business, then when the customer said:

I only want 1 page

it repeated the same recommendation and kept asking/arguing.

## New behavior

If the customer says they only need one page after a recommendation, Cookie AI should:

- accept the correction
- stop asking why they want one page
- explain that a plan controls features, not how many pages they are forced to build
- recommend Starter Pro for a one-page cookbook if they need media and Buy Now but do not need AI included
- recommend Business only if they specifically want AI Video Studio included in the website plan
- suggest Starter Pro + $5 standalone AI Video Studio as the lower-cost one-page option when appropriate

## Files included

- app/api/cookie-ai/route.js
- lib/cookieAiKnowledge.js
- docs/COOKIE_AI_ASSISTANT_V2_ONE_PAGE_REFINEMENT_FIX.md

## No SQL needed

This is only a chatbot plan recommendation accuracy fix.

## Test after Vercel says Ready

Click Clear in Cookie AI first.

Test this flow:

1. What plan fits me?
2. cookbook or digital recipes
3. yes
4. yes
5. yes ai video
6. small launch

Expected:
It may recommend Business because AI Video Studio is included.

Then type:

I only want 1 page

Expected:
It should not repeat the same Business answer blindly.
It should say something like:

- Got it, you only need one page.
- Business is only needed if you want AI Video Studio bundled.
- Cheaper one-page option: Starter Pro + $5 standalone AI Video Studio.
