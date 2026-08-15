# Cookie Mini Website Builder Pro — Launch Completion Checklist

Last updated: August 14, 2026

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
- [x] Canonical owner-password phase — owner production pass on August 13, 2026:
  - received the newest owner recovery email;
  - set a new password without changing the canonical Supabase identity;
  - signed into `/admin/subscriptions` and loaded the protected dashboard;
  - locked the Owner Dashboard and confirmed access was removed; and
  - signed back in successfully with the new password.
- [ ] Enable Supabase leaked-password protection if the project plan supports it; the current security advisor reports it disabled.

## Launch security and final readiness

- [x] Owner/admin subscription lifecycle operations and unmatched-event review implemented with masked review data, read-only provider recheck, preview-gated reconciliation, idempotent processing, and no arbitrary plan/access assignment. Production deployment and owner smoke verification are tracked separately from implementation.
- [x] Encrypted logical backup, Storage inventory, checksum verification, isolated-restore guards, retention schedule, and recovery documentation implemented. The first private backup and isolated restore drill require the owner-controlled destination and recovery key.
- [x] `handle_new_arcade_user()` ownership/dependencies investigated and its direct anonymous/authenticated RPC exposure removed without changing the Auth trigger behavior.
- [x] Cookie AI Assistant accuracy, prompt-boundary, privacy-copy, and safe-response validation completed.
- [x] Final automated mobile/accessibility sweep completed, including Cookie AI keyboard, focus, dialog, touch-target, and dynamic-viewport protections. Production route checks are recorded in the deployment report.
- [x] SEO/discoverability metadata, structured data, sitemap, policy consistency, launch-security documentation, and soft-launch technical review completed.
- [x] Browser Draft Backups owner production confirmation completed without renaming, continuing, overwriting, or deleting a real backup.
- [x] Final Builder-owned readiness pass completed: 330/330 tests, 56/56 protected AI Video tests, production schema type generation, 57-route build, syntax/security scans, live route/header/fingerprint checks, deployment/build review, and current runtime-error review passed.
- [x] Builder-owned technical readiness approved for a controlled soft launch; final verification was read-only and preserved customer and provider data.
- [ ] Obtain qualified legal review before a broad public launch; the completed repository review is technical and is not legal advice.
- [x] Initial production monitoring pass completed during final readiness review.
- [ ] Owner-controlled recovery proof: create the first encrypted off-repository backup and verify its checksum using the privately held recovery identity.
- [ ] Owner-controlled recovery proof: approve an isolated non-production Supabase project and complete the guarded restore drill.
- [ ] Begin the recurring documented soft-launch monitoring routine after the first encrypted backup is safely stored.

## Launch evidence rule

- Automated test passed is recorded separately from production browser passed.
- Provider acceptance is not recorded as inbox delivery.
- A Vercel `READY` deployment is not recorded as a customer-journey pass by itself.
- No additional purchase or account-flow test is required unless a verified regression is reported.
