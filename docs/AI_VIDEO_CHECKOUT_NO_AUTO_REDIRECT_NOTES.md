# AI Video Checkout Notes

This patch only changes app/checkout/ai-video/page.js.

It does not touch:
- Builder
- Pricing page
- Gumroad checkout routes for website plans
- Supabase
- Admin dashboard
- Customer dashboard
- AI Video Studio generation logic
- Terms or policies

The customer flow is now:
Landing Page or Pricing Page -> /checkout/ai-video -> customer clicks Continue to AI Video Checkout -> Gumroad -> /checkout/success?paid=ai-video -> AI Video Studio.
