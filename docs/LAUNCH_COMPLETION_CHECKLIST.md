# Cookie Mini Website Builder Pro — Launch Completion Checklist

Last updated: August 12, 2026

This checklist distinguishes automated verification from real owner production testing. A phase is marked complete only when its required customer journey has the appropriate production evidence.

## Completed and protected

- [x] Free Launch Page build, publish, and public-site opening — owner production pass.
- [x] Paid website purchase-to-activation and publishing — owner production pass using the approved Business $30/month product.
- [x] AI Video Test #11 — owner production pass for purchase, license verification, generation, processing, results, playback, download, one-credit enforcement, and customer isolation.
- [x] Customer Account Journey — owner production pass on August 11, 2026:
  - guest build and browser save;
  - Create Free Account;
  - real secure email delivery;
  - Builder-owned callback;
  - guest-draft transfer into My Websites;
  - Sign Out;
  - returning Sign In; and
  - saved-draft persistence.

Protected production baseline for the Customer Account Journey:

- Commit: `cac281bf5eb40e4a435e09f964c3c9a6f535ac4e`
- Vercel deployment: `dpl_AAsEW9uf9kDRmc3HUnvqdD4SKFTt`
- Live fingerprint: `cac281bf5eb4`
- Automated tests: 130/130 passed
- Protected AI Video tests: 56/56 passed

Do not reopen these completed journeys without evidence of a regression.

## Completed support-request reliability

- [x] Contact, consultation, and Free Launch Page request reliability — owner production pass on August 11, 2026.
  - Contact, consultation, and Free Launch Page requests were stored separately.
  - Owner and customer emails were received.
  - Customer Requests displayed the stored records.
  - The Free Launch Page email opened the approved $99 one-time Gumroad product.

## In progress — Done-for-You catalog checkout configuration

- [x] Free Launch Page — `$99 one-time setup` checkout configured and owner-verified.
- [x] Starter Pro — `$249 one-time setup` production setting and live Gumroad product page verified.
- [x] Business — `$499 one-time setup`; `DFY_BUSINESS_CHECKOUT_URL` configured and the live Builder handoff verified against the published one-time Gumroad product.
- [x] Premium — `$899 one-time setup`; `DFY_PREMIUM_CHECKOUT_URL` configured and the live Builder handoff verified against the published one-time Gumroad product.
- [x] Extra Page Add-On — `$125 one-time setup`; the exact public product `https://cookiepearson.gumroad.com/l/dfy-extra-page-addon` is verified as a one-time Done-for-You product and carried by `DFY_EXTRA_PAGE_CHECKOUT_URL` in the Vercel runtime configuration. The separate `$10/month` Extra Page subscription remains unchanged.

Do not substitute the Business or Premium monthly website subscriptions, the monthly Extra Page subscription, AI Video, or another DFY product for these one-time setup purchases.

## In progress — clean password account experience

- [x] Shared Mini Builder account modal implemented for desktop and mobile.
- [x] Builder and My Websites duplicate Create Account / Sign In button blocks removed.
- [x] Returning customers use Supabase password sign-in without a routine email link.
- [x] New accounts receive one Builder-owned email confirmation.
- [x] Existing customers can set or reset a password without changing their Supabase user ID.
- [x] Customer sessions moved to a Secure, HttpOnly, SameSite cookie; existing browser bearer sessions are adopted once and removed from local storage.
- [x] My Websites search uses the authenticated owner and cannot accept a public email identity.
- [x] Owner website/request searches remain admin-protected and bounded.
- [x] Compact Done-for-You success messages dismiss automatically after 8.5 seconds; stored requests and email request IDs remain unchanged.
- [x] Owner live verification passed for the newest reset email, password setup, returning password sign-in, My Websites, edit/republish, sign out, and editor reauthentication.
- [ ] Enable Supabase leaked-password protection if the project plan supports it; the current security advisor reports it disabled.

## Remaining after the current phase

- [x] Owner/admin subscription lifecycle operations and unmatched-event review implemented with masked review data, read-only provider recheck, preview-gated reconciliation, idempotent processing, and no arbitrary plan/access assignment. Production deployment and owner smoke verification are tracked separately from implementation.
- [ ] Cookie AI Assistant final live accuracy and safe-response validation.
- [ ] Final mobile/accessibility production sweep for any routes not already owner-verified.
- [ ] SEO, policy/legal review, launch documentation, and soft-launch monitoring.

## Launch evidence rule

- Automated test passed is recorded separately from production browser passed.
- Provider acceptance is not recorded as inbox delivery.
- A Vercel `READY` deployment is not recorded as a customer-journey pass by itself.
- No additional purchase or account-flow test is required unless a verified regression is reported.
