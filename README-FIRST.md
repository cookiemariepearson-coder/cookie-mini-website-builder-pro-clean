# Cookie Mini Website Builder Pro — Builder Glitch Polish Fix 3

Upload this package to the CLEAN GitHub repo only:

cookie-mini-website-builder-pro-clean

What this update improves:
- Keeps paid checkout routes active so checkout does not return to 404.
- Adds a Draft name / website address field so customers can save more than one draft without guessing the full subdomain.
- Adds Start Fresh Draft button so old draft data does not keep sticking to new builds.
- Saves the current draft slug in browser storage so AI Video Studio and My Website can return to the right draft.
- Saves the draft online before paid checkout.
- Makes media uploads smaller to reduce freezing.
- Gallery/Portfolio/Menu/Product media now tries to auto-select that page when the current plan allows it.
- Free Launch Page keeps extra media saved in draft but reminds the customer that Free publishes Home only.
- Template switching keeps updating layout, background feel, font feel, and card style.
- Adds extra polish to the preview so template changes are more visible.

No new Supabase SQL is required for this update if you already ran the draft/site migrations.

Test after Vercel is Ready:
1. Open /builder
2. Start a Free Launch Page
3. Enter Website Info, including Draft name / website address
4. Change template on Design
5. Upload hero image
6. Add Gallery or Portfolio media
7. Save Draft
8. Open AI Video Studio and return
9. Open My Drafts and search by email
10. Test paid checkout route
