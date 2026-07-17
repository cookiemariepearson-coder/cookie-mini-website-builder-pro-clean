# Cookie Mini Website Builder Pro — Clean Sweep Build

This is a clean Vercel-ready Next.js build that keeps the working pieces and removes the messy broken updates.

## What is included
- Purpose-based website builder
- Type + design/look selection
- Side-by-side live preview
- Free Launch Page, Starter, Business, Premium pricing flow
- Gumroad checkout environment variables
- Supabase publishing and public customer subdomains
- Customer dashboard and edit page
- Admin Plan Management page
- AI Video Studio creative kit mode
- Media links and small image upload stored in site JSON
- Launch pages, pricing, FAQ, contact, and legal pages

## Use this as a new project
Recommended: create a new GitHub repo and new Vercel project first. Keep the old live site untouched until this one is tested.

Suggested repo name:
`cookie-mini-website-builder-pro-clean`

Suggested Vercel project name:
`cookie-mini-website-builder-clean`

## Supabase
Run:
`supabase/clean_websites_schema.sql`

## Vercel Environment Variables
Add these in the new Vercel project:

NEXT_PUBLIC_ROOT_DOMAIN=cookiesdigitalcreations.com
NEXT_PUBLIC_SUPABASE_URL=your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=your service role key
ADMIN_PIN=your private admin pin
NEXT_PUBLIC_STARTER_SUBSCRIPTION_CHECKOUT_URL=https://your Gumroad starter link
NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL=https://your Gumroad business link
NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL=https://your Gumroad premium link
NEXT_PUBLIC_EXTRA_PAGE_SUBSCRIPTION_CHECKOUT_URL=https://your Gumroad extra page link

## Important
Do not upload node_modules, .next, or package-lock.json.

## Test links after deployment
/builder
/pricing
/customer
/admin
/video-studio
/how-it-works
/faq
/contact
/legal

## Switching the domain
Do not move cookiesdigitalcreations.com to the new Vercel project until the temporary .vercel.app link works.
