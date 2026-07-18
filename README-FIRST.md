# Builder Drafts + Customer Dashboard Fix

Upload these inside files/folders to the clean repo only:

`cookie-mini-website-builder-pro-clean`

Before testing, run this SQL in the Cookie Mini Website Builder Supabase project:

`supabase/builder_drafts_customer_dashboard_migration.sql`

This update adds:
- customer dashboard search by email, slug, or full subdomain
- one box showing all saved published sites and drafts
- continue draft links back into the builder
- builder opens online draft using `/builder?draft=site-slug`
- save draft / continue later button
- checkout routes preserved
- AI Video Studio return flow preserved
- media and template stability files preserved
