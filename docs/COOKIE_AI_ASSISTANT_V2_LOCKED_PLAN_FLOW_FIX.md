# Cookie AI Assistant v2 - Locked Plan Flow Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

Cookie AI was still repeating the same question because it was guessing the plan conversation from chat history.

This fix stops the guessing.

It adds a real locked plan-picking state so Cookie AI remembers exactly which question it already asked and what the customer answered.

## What changed

- Adds browser-saved plan state
- Sends plan state to the chatbot API
- API uses that state instead of guessing from chat history
- Prevents double sending while a response is loading
- Removes repeated back-to-back identical messages
- Keeps the plan flow moving:
  1. business type
  2. customer action
  3. photos/videos/media
  4. AI Video Studio
  5. small launch page vs fuller website
  6. recommendation

## Files included

- components/CookieAiAssistant.js
- app/api/cookie-ai/route.js
- lib/cookieAiKnowledge.js
- docs/COOKIE_AI_ASSISTANT_V2_LOCKED_PLAN_FLOW_FIX.md

## No SQL needed

This is only a chatbot accuracy/state fix.

## Important testing note

After Vercel says Ready:

1. Open Cookie AI.
2. Click Clear.
3. Refresh the website page.
4. Open Cookie AI again.
5. Test the flow below.

## Test flow

Ask:
What plan fits me?

Reply:
cookbook or digital recipes

Reply:
yes

Expected:
It should move to AI Video Studio question, not repeat the photos/videos question.

Reply:
no

Expected:
It should move to small launch page vs fuller website.

Reply:
small launch page

Expected:
It should recommend Starter Pro for a cookbook/digital recipe product with media needs, or Free only if no media and no AI are needed.
