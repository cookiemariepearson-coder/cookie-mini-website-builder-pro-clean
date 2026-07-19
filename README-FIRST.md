# Cookie Mini Website Builder Pro — Admin Subscriptions Organizer + Archive Box Fix

Upload these files to the clean GitHub repo only:

cookie-mini-website-builder-pro-clean

What this fixes:

- Adds sort controls to `/admin/subscriptions`.
- Adds search by website name, slug, email, plan, and status.
- Adds plan filter.
- Changes the subscription admin list into user-friendly website cards.
- Adds an Archive Box.
- When a site is archived, it leaves the active organizer view and appears in the Archive Box.
- Adds Retrieve from Archive.
- Adds Hide from View for owner-side organization only.
- Adds Hidden Box so hidden sites can be restored.
- Keeps Pause and Reactivate actions.
- Does not require new Supabase SQL.
- Does not change checkout, customer dashboard, builder, HeyGen, or Gumroad webhooks.

After Vercel says Ready, test:

https://www.cookiesdigitalcreations.com/admin/subscriptions

Use your admin PIN, then test:

1. Sort by name, plan, status, and newest.
2. Hide one website from view, then restore it from Hidden Box.
3. Archive one test site, confirm it moves to Archive Box.
4. Retrieve it from Archive Box.
5. Pause and reactivate a test site.
