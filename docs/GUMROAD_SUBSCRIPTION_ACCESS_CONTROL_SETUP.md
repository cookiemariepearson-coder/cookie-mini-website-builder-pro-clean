# Gumroad Subscription Status + Website Access Control Setup

This upgrade adds a Gumroad webhook endpoint and an owner dashboard for subscription status.

## 1. Run Supabase SQL
Run this file in the Cookie Mini Website Builder Supabase project:

`supabase/gumroad_subscription_status_access_migration.sql`

## 2. Add Vercel environment variable
In the clean Vercel project, add:

`GUMROAD_ACCESS_TOKEN`

Do not share the token publicly. Redeploy after adding it.

## 3. Register webhooks
After deployment, open:

`https://www.cookiesdigitalcreations.com/admin/subscriptions`

Enter your admin PIN, then click **Register Gumroad Webhooks**.

This registers these resources:
- sale
- refund
- cancellation
- subscription_ended
- subscription_restarted
- subscription_updated
- dispute
- dispute_won

## 4. Manual setup option
If you prefer to do this manually in Gumroad, use these webhook URLs:

- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=sale`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=refund`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=cancellation`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=subscription_ended`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=subscription_restarted`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=subscription_updated`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=dispute`
- `https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=dispute_won`

## 5. Recommended Gumroad custom field
Add a custom checkout field to paid Gumroad products:

**Website name/subdomain**

This helps match the Gumroad customer payment to their saved website.

## 6. What happens after webhook events
- Sale / restarted / updated / dispute won: marks matching website active.
- Cancellation / subscription ended / refund / dispute: pauses matching paid website.
- If no matching website is found, the event is saved for manual review.

## 7. Owner dashboard
Use:

`https://www.cookiesdigitalcreations.com/admin/subscriptions`

There you can:
- See all sites and subscription statuses
- Manually change plan/status/access
- See unmatched Gumroad events
- Add admin notes
- Register Gumroad webhooks if `GUMROAD_ACCESS_TOKEN` exists
