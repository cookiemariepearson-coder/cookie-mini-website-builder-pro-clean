# Cookie Mini Website Builder Pro - Cookie AI Assistant v1

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this adds

Cookie AI Assistant v1 support chatbot.

It adds a floating button:

Ask Cookie AI

The chatbot can help customers with:
- choosing a plan
- understanding pricing
- using the builder
- picking sections
- adding Order / Book / Buy
- adding Book Now, Order Now, Buy Now, or Request Quote
- understanding AI Video Studio
- publishing a website
- finding the right page

## Files included

- components/CookieAiAssistant.js
- app/api/cookie-ai/route.js
- app/cookie-ai-assistant.css
- app/layout.js
- docs/COOKIE_AI_ASSISTANT_V1_SETUP.md

## Vercel Environment Variable

For real AI answers, add this in Vercel:

Name:
OPENAI_API_KEY

Value:
your OpenAI API key

Optional:

Name:
OPENAI_MODEL

Value:
gpt-4o-mini

## Works without OpenAI key too

If OPENAI_API_KEY is missing, the chatbot still works in basic guide mode with built-in answers for plans, publishing, AI Video Studio, and Order / Book / Buy.

## Test after Vercel says Ready

Open:

https://www.cookiesdigitalcreations.com/

Confirm:
1. Ask Cookie AI button appears bottom-right.
2. Click it.
3. Ask: Which plan should I choose?
4. Ask: How do I add Order / Book / Buy?
5. Ask: How does AI Video Studio work?
6. Ask: How do I publish?
