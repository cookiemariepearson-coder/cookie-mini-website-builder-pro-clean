# Cookie Mini Website Builder Pro - Plan Accuracy + Section Limits + AI Access Fix

Upload these inside files/folders to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

## What this fixes

This is the big accuracy correction Cookie requested before rollout.

### Plan section limits
- Free Launch Page: 3 selected sections.
- Starter Pro: 4 selected sections plus image/video upload options.
- Business: 6 selected sections plus image/video upload options and AI Video Studio.
- Premium: all built-in sections plus image/video upload options and AI Video Studio.

### Important image accuracy cleanup
- Old plan images are not used as the live plan explanation in this pack because the plan limits changed.
- The live home/pricing pages now use accurate text plan cards.
- New Gumroad/website graphics should be regenerated after this code passes testing.

### Builder cleanup
- Pages & Wording is renamed to Sections & Wording.
- Only selected sections show in the wording form.
- Only selected sections show in the live preview.
- This keeps the builder shorter and less confusing.
- Section buttons lock when a plan limit is reached.
- Home stays required.
- Free Launch Page no longer shows image/video upload fields.
- Starter Pro, Business, and Premium show image/video upload options.

### AI Video Studio access
- Free and Starter cannot open AI Video Studio from the builder.
- Lower plans see an upgrade message instead.
- Business and Premium can open AI Video Studio.

### Checkout success page
- Success page now shows which plan was completed.
- Success page shows the publishing section limit and selected sections.
- Contact Us help box was moved beneath Start Fresh Draft and the other action buttons.

### Policies
- Terms, Subscription Policy, and AI Video Policy were updated to match the new plan limits and AI access.

## No Supabase SQL needed

This is a code, wording, and policy update only.

## Test after Vercel says Ready

1. Open /builder.
2. Test Free Launch Page: select up to 3 sections. Confirm only selected section wording boxes show.
3. Test Starter Pro: select up to 4 sections and confirm uploads show.
4. Test Business: select up to 6 sections and confirm AI Video Studio opens.
5. Test Premium: confirm all sections can be selected.
6. Test Free/Starter AI Video button: it should show upgrade behavior, not open the studio.
7. Run each checkout success URL and confirm the top plan summary is correct:
   - /checkout/success?paid=free
   - /checkout/success?paid=starter
   - /checkout/success?paid=business
   - /checkout/success?paid=premium
8. Open /legal/terms, /legal/subscription, and /legal/ai-video.

Important: Update Gumroad product descriptions/images to match these plan limits before public rollout.
