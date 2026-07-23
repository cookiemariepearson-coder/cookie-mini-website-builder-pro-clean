# Cookie AI Assistant v3 - GPT Smart Advisor

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## Why this version is different

The previous chatbot used a hard-coded step-by-step plan wizard. That made it repeat questions and misunderstand short answers.

This version removes the rigid plan wizard.

Cookie AI now uses the OpenAI model as the smart advisor and uses the full conversation to decide what to ask or recommend.

## Recommended model

In Vercel, set:

OPENAI_MODEL = gpt-5.1

If your OpenAI API account does not have access to gpt-5.1 yet, the API route will try backups:

- gpt-4.1
- gpt-4o

## Files included

- app/api/cookie-ai/route.js
- lib/cookieAiKnowledge.js
- docs/COOKIE_AI_ASSISTANT_V3_GPT_SMART_ADVISOR.md

## No SQL needed

This is only a chatbot intelligence/behavior upgrade.

## Keep this Vercel variable

OPENAI_API_KEY

## Add or update this Vercel variable

OPENAI_MODEL = gpt-5.1

Then redeploy.

## Test after Vercel says Ready

Click Clear inside Cookie AI first.

Test:

Which plan should I choose?
coaching or classes
I need people to book classes
yes photos
no AI
one page

Expected:
It should recommend Starter Pro for a simple one-page coaching/classes site with media and booking.

Test:

Which plan should I choose?
cookbook or digital recipes
Buy Now
yes images
yes AI video
one page

Expected:
It should explain:
- Business if AI Video Studio is bundled with the website plan
- Starter Pro + $5 standalone AI Video Studio as the lower-cost one-page option
