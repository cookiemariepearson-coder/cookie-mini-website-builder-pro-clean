# Cookie AI Assistant v2 - Conversation Memory Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

Cookie AI was asking the right first question, but it was not staying in the same conversation.

Example problem:

Customer:
What plan fits me?

Cookie AI:
Asks discovery questions.

Customer:
cooking

Cookie AI:
Reset to generic help.

Customer:
a cookbook

Cookie AI:
Jumped to Order / Book / Buy instructions.

## New behavior

Cookie AI now remembers that the customer is in the plan-picking conversation.

Expected new flow:

Customer:
What plan fits me?

Cookie AI:
Asks what type of business, buttons, media, AI Video Studio, and small/full site.

Customer:
cooking

Cookie AI:
Asks what kind of cooking business:
cookbook, food plates, restaurant/menu, cooking classes, or cooking content.

Customer:
a cookbook

Cookie AI:
Recognizes cookbook/recipe product and asks whether customers need Buy Now or if it is just a showcase.

Then it continues asking about media, AI Video Studio, and site size before recommending the best plan.

## Files included

- app/api/cookie-ai/route.js
- lib/cookieAiKnowledge.js
- docs/COOKIE_AI_ASSISTANT_V2_CONVERSATION_MEMORY_FIX.md

## No SQL needed

This is only a chatbot accuracy/conversation-memory fix.

## Test after Vercel says Ready

Important:
Click Clear in the Cookie AI chat before testing so old bad chat history does not interfere.

Test this exact flow:

1. Ask:
What plan fits me?

2. Reply:
cooking

3. Reply:
a cookbook

Expected:
It should stay inside the plan recommendation flow and ask follow-up questions about Buy Now, photos/videos, AI Video Studio, and small page vs fuller website.
