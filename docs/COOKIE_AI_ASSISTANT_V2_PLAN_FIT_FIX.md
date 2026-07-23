# Cookie AI Assistant v2 - Plan Fit Question Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

When a customer asks:

What plan fits me?
Which plan should I choose?
What plan is best for me?
Help me pick a plan.

Cookie AI was listing all plans too fast.

This fix makes Cookie AI ask discovery questions first when the customer has not explained their business yet.

## New response behavior

For vague plan-fit questions, Cookie AI now asks:

1. What type of business is this for?
2. Do you need people to Book, Order, Buy, Request a Quote, Call, Text, or Email?
3. Do you need photos or videos on the site?
4. Do you need AI Video Studio included?
5. Do you want a small launch page or a fuller website?

Then after the customer answers, Cookie AI can recommend the best plan.

## Files included

- app/api/cookie-ai/route.js
- lib/cookieAiKnowledge.js
- docs/COOKIE_AI_ASSISTANT_V2_PLAN_FIT_FIX.md

## No SQL needed

This is only a chatbot behavior fix.

## Test after Vercel says Ready

Open the chatbot and ask:

What plan fits me?

Expected response:
It should ask about the business type, buttons, photos/videos, AI Video Studio, and small page vs fuller website.

Then answer:

I have a hair salon and need booking, photos, and AI video.

Expected response:
It should recommend Business or Premium depending on needs, not just list every plan.
