# AI Video Studio API Setup Prep

This project currently has AI Video Studio in creative kit mode. It creates scripts, captions, shot lists, voiceover copy, and video prompts. The next phase is connecting real MP4 generation.

## Provider decision needed
Choose one first:

- Runway: strong general AI video generation.
- Luma: text/image-to-video style workflows.
- Replicate: flexible API with multiple models.
- HeyGen: best for talking avatar/spokesperson videos.

## Information Cookie needs before the API build

1. Provider account created.
2. API key copied.
3. Monthly budget or credit limit chosen.
4. Decision on which plans get real video generation.
5. Credit rules, for example:
   - Free: creative kit only.
   - Starter: creative kit only or 1 demo/month.
   - Business: 1 real video/month.
   - Premium: 3 real videos/month.
   - Extra video credits: paid add-on.

## Likely Vercel variables later

These are examples. Only add the one for the provider selected.

- RUNWAY_API_KEY
- LUMA_API_KEY
- REPLICATE_API_TOKEN
- HEYGEN_API_KEY

Do not add these until the provider has been chosen.
