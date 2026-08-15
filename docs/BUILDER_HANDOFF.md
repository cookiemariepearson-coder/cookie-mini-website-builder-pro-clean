# Cookie Mini Website Builder Pro — Production Handoff

Last updated: August 14, 2026

This document is the consolidated handoff for the completed owner-authentication, launch-security, backup/recovery, Cookie AI, AI Video usability, My Websites usability, browser-draft backup management, accessibility/mobile, SEO, policy-consistency, and soft-launch technical-readiness work. It records the verified production state without storing credentials, secret values, customer details, database dumps, recovery material, provider project identifiers, or exact production record counts. Those operational values must be read only from the authorized provider dashboards and encrypted owner records.

## Authoritative production baseline

- Repository: `cookiemariepearson-coder/cookie-mini-website-builder-pro-clean`
- Source-of-truth branch: `main`
- Completed implementation PR: `#23` — Harden launch security and recovery
- Completed AI Video usability PR: `#25` — Simplify the AI Video customer journey
- Completed AI Video cache-hardening PR: `#26` — Harden protected video response caching
- Completed AI Video account-routing PR: `#28` — Require customer accounts for AI Video
- Completed My Websites PR: `#30` — Simplify My Websites management
- Completed browser-draft management PR: `#32` — Simplify browser draft backup management
- Starting production commit: `440e72683ec6708fff7b63887379837380736681`
- Launch-security production commit: `a23d34493fed112541b62628ea98a8299e9b9374`
- AI Video usability production commit: `fbf592986b18c1cabd8c9c9e65d08b053102b002`
- Current production application commit: `cf8d347f04a6ceb3478722322c7283272dce4a1e`
- Current production source-of-truth commit before this final documentation handoff: `3ce027d3644528a3d73e0d2ef5f672a595fe1aa4`
- Vercel production deployment state: `READY`
- Vercel production deployment: `dpl_9BYYauV9jTFgntZVZVtSdLrwZ4Wd`
- Verified live build fingerprint: `3ce027d36445`
- Existing GitHub repository, Vercel project, Supabase project, production domains, Gumroad products, and provider connections were preserved. No duplicate project, repository, OAuth application, or production connection was created.

## Formal phase status

### Canonical owner-password phase: PASSED

The owner personally completed the required production checks:

- received the one authorized recovery email;
- set a new password without replacing the existing Supabase identity;
- signed in at `/admin/subscriptions`;
- confirmed the protected owner dashboard loaded;
- selected **Lock Owner Dashboard** and confirmed access was removed; and
- signed back in successfully with the new password.

The canonical owner identity already existed exactly once, remained email-confirmed and password-capable, and retained its original Supabase user ID. No duplicate owner was created. The server now enforces one canonical normalized owner address; legacy owner-email environment variables cannot expand the allowlist. Email comparisons trim whitespace and normalize case.

Owner and customer authentication remain separate. Both use server-validated Supabase identities and separate Secure, HttpOnly, SameSite cookies. Signed-out, expired, malformed, customer-only, and noncanonical-owner sessions fail closed with private/no-store responses. Locking clears the owner cookie. Normal owner sign-in uses email and password and does not send email. Password recovery remains explicit, mailbox-controlled, single-use, expiring, non-enumerating, and routed only through `/admin/auth/password`.

Preserved controls include minimum 10-character passwords, the existing sign-in and recovery rate limits, honeypot/CAPTCHA passthrough, non-enumerating errors, protected owner APIs, customer ownership isolation, and password reset only when requested. No additional recovery email was sent during the launch-security phase.

### Simplified AI Video usability phase: PASSED

The former AI Video entry screen let a signed-out visitor reach standalone purchase and recovery choices without first establishing a customer account. The top navigation, homepage product cards, Builder upsell, direct checkout, Gumroad return, and results recovery paths did not all enforce the same account-first journey. Standalone access was tied to a browser-held purchase namespace rather than an immutable authenticated owner, so a returning customer could not reliably recover an existing paid result on another browser.

`/video-studio` is now the single, guided front door to the existing protected workflow. It opens with **Create Your AI Video**, a short explanation, and the five-stage **Get Started → Plan → Review → Create → Results** indicator. The server determines the next safe state and the page shows one dominant action:

- a signed-out visitor sees **Create an account or sign in to purchase, create, and access your AI videos.**, **Create My Account**, and **Sign In**—never a purchase button or license form;
- only the exact allowlisted return targets `/video-studio?intent=purchase`, `/video-studio?claim=1`, and `/video-studio/results` survive account creation or sign-in;
- a signed-in customer without an entitlement sees **Buy One Video — $5** and proceeds through the existing protected checkout;
- an authenticated Business/Premium customer is matched to eligible owned websites server-side; one site is selected automatically and only multiple eligible sites produce a selector;
- an authenticated standalone buyer can use **Need Help? → I already purchased a $5 video** to verify the exact Gumroad product and atomically claim it to the immutable customer user ID;
- an unused verified credit offers **Start My Video** or **Continue My Video** when a plan is saved;
- a processing job routes to status and cannot encourage a second submission;
- a completed job routes to protected results; and
- a completed job with no remaining credit shows **You have used your video credit.**, **Buy Another Video — $5**, **View My Video**, and only when applicable **View My Saved Plan**.

The planning experience is now a seven-screen wizard: Business or product, Video goal, Audience, Style and tone, Important details, Review the plan, and Create the video. Progress and the exact active step are saved locally for usability only, with **Your progress is saved.** Browser state never proves purchase, ownership, entitlement, or credit. Back, refresh, return from sign-in, and return from Gumroad resume the relevant point. The review screen states that creation uses one video credit, and the final deliberate submission uses a stable request identifier plus in-flight locking to preserve idempotency and prevent duplicate clicks.

Every public AI Video entrance now routes through the studio: top navigation uses `/video-studio`; both homepage AI Video links, both pricing links, and the Builder upsell use `/video-studio?intent=purchase`. Direct `/checkout/ai-video` is account-gated and does not expose the external checkout while signed out. The checkout return is `/video-studio?claim=1`; this query value preserves only safe UX intent and never proves payment. `/checkout/success?paid=ai-video` likewise makes no purchase claim from its query string and routes the signed-in customer to protected claim recovery.

Results reacquire an owner-scoped signed access pass from the verified HttpOnly customer session. They do not use typed email, local storage, query parameters, or exposed provider URLs as identity. Processing refreshes remain read-only. Watch and download use the protected same-origin media route. The owner's already-completed paid purchase and job retain their original namespace and can be attached once to the existing customer account without repurchase, regeneration, or credit use. No live video was generated and no real credit was purchased, reserved, or consumed during this phase.

The owner subsequently completed the one required non-destructive production confirmation. The existing customer account signed in, **Need Help? → I already purchased a $5 video** accepted the existing Gumroad key, and the previously completed video appeared. The owner did not repurchase, regenerate, submit, reserve, or consume another credit. This confirmation is **PASSED** and must not be repeated unless a verified regression is reported.

### Simplified My Websites phase: PASSED

`/customer` is now a plain-language, mobile-friendly **My Websites** dashboard with the explanation **View, edit, publish, and manage your websites.** Customer-owned records are separated into clear **Published** and **Unpublished** sections. Each card puts **Edit Website** first, shows the website name, simple status, last-updated date, published address and **View Website** when applicable, and moves uncommon controls into a compact **Manage Website** menu. Empty, loading, search, and signed-out states are short and customer friendly. Eligible signed-in customers receive **Create a New Website** without being shown internal IDs, entitlement terminology, prices, or long plan instructions.

Unpublishing requires the deliberate **Keep Website Published** / **Unpublish Website** confirmation. A successful request atomically changes only the publication status and unpublish timestamp, preserves the saved site JSON and all ownership/billing/entitlement fields, immediately moves the card to Unpublished, blocks public rendering, and allows the same verified owner to edit and publish the website again. The public site route now requires the authoritative database status to be `published` instead of treating every non-paused row as public.

Deletion is separate and more serious. The customer must type the server-derived website name before **Delete Website** is enabled. The server authenticates first, verifies immutable ownership, validates the name independently, scopes the mutation by website row and owner ID, and uses a conditional timestamp/status update so repeat or concurrent requests fail safely. No website row is hard-deleted. The website moves to protected recoverable Trash, disappears from My Websites and public access, and retains its content plus required billing, purchase, subscription, security, and audit records. Accounts, other websites, AI Videos, checkout records, and Gumroad events are untouched. There is no automatic permanent purge. Support/admin recovery may return the retained row to draft, or to published only while verified access remains active.

The dashboard updates successful unpublish/delete results without a page refresh and retains the search/scroll return state across editing. Dialogs trap keyboard focus, close with Escape, restore focus after cancellation, expose labelled dialog/error/status semantics, and use visible focus plus at least 44-pixel controls. The responsive card/action/dialog rules apply at 760 pixels and below without horizontal overflow.

The owner subsequently completed the one required non-destructive production confirmation. The real customer dashboard displayed the **Published** and **Unpublished** sections; the owner opened and canceled the website-management confirmation controls without unpublishing or deleting a production website. This confirmation is **PASSED** and must not be repeated unless a verified regression is reported.

### Browser Draft Backup management phase: PASSED

The former browser-backup area was a compact list that exposed only **Continue Draft**, hid backups whose slug matched an online website, showed only a date without the saved time, offered no safe organization or cleanup controls, and could silently omit all backup UI when the index was empty or unreadable. A large device-local collection was therefore difficult to identify and manage.

**Browser Draft Backups** is now a visibly separate dashboard section, independent from Published, Unpublished, recoverable Website Trash, and other server-saved records. It explains that these backups exist only in the current browser profile, may not appear on other devices, and may be evicted if the browser's site data is cleared. The accurate total always represents the complete readable backup index, while only six cards appear initially. **Show More** progressively reveals the rest without changing the total. Sorting supports **Newest**, **Oldest**, and **Name**, defaults to Newest, and persists for the browser session.

Each card shows a customer-friendly draft name, an exact localized saved date and time when present, the template category and style when both can be resolved reliably, a **Browser backup** label, one primary **Continue Draft** action, and a compact, draft-specific **Manage Draft** menu. Long names wrap, action and selection controls meet the 44-pixel target, and the selection toolbar reflows to a single mobile column.

**Rename Draft** writes only `browserDraftDisplayName` on the selected local object. It preserves the storage key, content, template, saved `updatedAt` history, and every other field. Empty, punctuation-only, control-character, and overlong names fail with announced guidance. Duplicate display names are permitted and remain distinguishable by their saved date and time. The active working copy is synchronized only when it has the same stable local identity.

**Delete Draft**, **Delete Selected**, and the less-prominent **Delete All Browser Drafts** are separate, deliberate actions. Individual, selected-count, and all-count dialogs state that server-saved websites are not deleted; individual deletion also names the account, subscription, purchase, and AI Video protections. The first click only opens a dialog. Confirmation writes the browser index once, removes only the selected keys, updates cards/counts without a reload, announces success, clears the active working copy only when its stable identity was deleted, and blocks repeated clicks. Cancel and Escape make no storage change and return focus to the initiating control.

Continue prepares only the selected draft as the active builder copy and carries its exact index key in `browserDraftStorageKey`. Builder autosave and checkout-success updates honor that stable key so a continued legacy draft cannot overwrite a different backup merely because its display fields change. Opening does not rewrite the backup index. The selected content and template are spread intact into the active copy.

The current storage design is one JSON object at `localStorage['cookieDraftSitesIndex']`; each object property is the unique browser-local backup identity and each value is the light draft JSON. `localStorage['cookieDraftSite']` is the separate active working copy, `cookieBuilderCurrentSlug` tracks its local identity, and `cookieBuilderStep` tracks its builder position. These values are origin- and browser-profile-scoped, not Supabase records and not bound to an authenticated customer ID. Anyone using the same browser profile can access that origin's local data; clearing site data, private-browsing disposal, storage pressure, or browser eviction can remove it. The dashboard does not imply online or cross-device storage.

Legacy slug-keyed objects without `browserDraftStorageKey` remain readable; Continue adds the identity only to the active copy, and the next normal builder save retains that same key. Invalid JSON or an unsupported top-level format produces an announced, non-destructive error and is never rewritten by the dashboard, builder index save, or checkout index update. An individual non-object entry appears as unreadable, cannot Continue or Rename, and can still be deliberately deleted without touching other entries.

Preview was intentionally omitted because the existing builder restore path starts autosave and cannot guarantee a strictly read-only view. Duplicate was intentionally omitted because legacy identity is the slug-like object key and the current builder does not yet provide a collision-proof independent-copy lifecycle. No misleading control was shipped.

Implementation changed `app/customer/page.js`, `components/BrowserDraftDialog.js`, `lib/browserDraftBackups.mjs`, `app/builder/page.js`, `app/checkout/success/page.js`, and `app/globals.css`; `tests/browserDraftBackups.test.mjs` supplies the 38-case isolated matrix. No dependency, lockfile, environment, migration, RLS, API route, provider setting, price, domain, or secret file changed.

The owner subsequently completed the required production confirmation in the normal browser profile containing the real backups. The Browser Draft Backups total and first six cards appeared; saved date/time and available template labels were visible; and the Rename Draft, Delete Draft, Delete Selected, and Delete All Browser Drafts management surfaces worked. The owner intentionally deleted exactly one browser-only backup, and the displayed total immediately changed from 29 to 28. Server-saved and published websites were unchanged. No further browser-draft verification remains. This confirmation is **PASSED** and must not be repeated unless a verified regression is reported.

## Final production-readiness decision

- **Builder-owned implementation and technical launch readiness: PASSED.** The protected account, checkout, subscription, website, AI Video, browser-draft, security, accessibility/mobile, SEO, backup-tooling, and recovery-documentation scopes are implemented and regression-tested.
- **Current production deployment health: PASSED.** The existing production project is `READY`, its aliases have no error, the public homepage and protected customer/owner/AI Video surfaces respond from the expected live fingerprint, signed-out protected video access fails with `401` and `private, no-store`, and no runtime-error group or error/fatal production log appeared in the final one-hour verification window.
- **Customer-data preservation: PASSED.** Final verification was read-only. No customer, website, browser draft, purchase, subscription, Gumroad event, domain, AI Video, entitlement, provider connection, or production secret was created, changed, reconciled, consumed, exposed, or deleted.
- **Recovery implementation: PASSED; first operational recovery proof: BLOCKED BY OWNER-CONTROLLED INPUTS.** The encrypted backup and guarded isolated-restore tooling is complete, but the first real backup cannot be created without a private off-repository destination and owner-held `age` recovery identity, and the first restore drill cannot be run without an approved isolated Supabase test project.
- **Safe launch decision:** the application is technically ready for a controlled soft launch. Do not treat disaster recovery as operationally proven until the two owner-controlled recovery actions below are completed.

## Security results

### Arcade Auth trigger investigation and hardening

`public.handle_new_arcade_user()` belongs to the Mini Website Builder production Supabase project. It is not in the separate Cookie Connect project.

- Owner/language: `postgres` / PL/pgSQL.
- Mode: `SECURITY DEFINER`.
- Trigger: enabled `on_arcade_user_created`, `AFTER INSERT ON auth.users FOR EACH ROW`.
- Purpose: idempotently provision one Joy House Arcade profile, wallet, and progress row for a new Auth user.
- Application callers: none in Mini Builder source; the legitimate caller is the database Auth trigger.
- Cookie Connect: no matching function or Arcade tables were found there.
- Authorization: user metadata affects display names only and does not grant Builder, customer, subscription, or owner access.

Before migration, the function used `search_path=public` and allowed direct execution by `PUBLIC`, `anon`, `authenticated`, and `service_role`, which exposed it as a Data API RPC. Migration `20260813175119_restrict_arcade_user_trigger_function.sql` retained the function and Auth trigger, set a fixed empty `search_path`, fully qualified referenced objects/functions, revoked direct execution from those roles, and retained execution only for `postgres` and `supabase_auth_admin`.

The migration is reversible. `supabase/rollbacks/20260813175119_restrict_arcade_user_trigger_function.rollback.sql` restores the former search path and grants for emergency rollback. Do not run the rollback merely because a downstream test fails; first establish whether the trigger or privilege change caused the failure.

The migration was recorded once in production history. The trigger remained enabled, direct protected-role execution was denied, and account-provisioning behavior was preserved. The Supabase security-advisor warnings for anonymous and authenticated execution of this `SECURITY DEFINER` function disappeared afterward.

### Application and launch-readiness repairs

- Corrected all identified public descriptions of the standalone `$5` AI Video purchase: it includes planning tools plus one real AI-generated video, subject to provider processing, moderation, availability, and protected one-credit enforcement.
- Strengthened Cookie AI prompt boundaries by treating customer messages, conversation history, and Builder draft fields as untrusted data that cannot override system instructions or authorize secrets, tools, billing, or owner functions.
- Prioritized video-script requests as AI Video intent and aligned fallback answers with the protected entitlement.
- Added accessible Cookie AI modal semantics, keyboard focus containment/restoration, Escape handling, visible focus, mobile dynamic-viewport behavior, adequate touch targets, and optional-data privacy copy.
- Removed public wording that implied typed email could establish customer identity. My Websites continues to use the verified user ID with its narrowly scoped legacy ownership fallback and cross-customer isolation.
- Added canonical metadata, stable sitemap dates, public structured data, and protected-route `noindex` controls.
- Redirected retired public owner/test checklist pages to protected `/admin` access.
- Clarified privacy, support, AI Video, and subscription language. Paid entitlement corrections continue to require exact authoritative provider evidence and protected reconciliation.
- Updated the vulnerable transitive `nanoid` override to patched `3.3.18`; the final dependency audit reports zero vulnerabilities.

### AI Video security and billing preservation

- Account discovery is authenticated with the existing server session and immutable owner identity. Typed email, query parameters, local storage, and editable metadata do not establish access.
- Existing exact-product Gumroad verification remains server-side and non-consuming. A verified purchase is atomically and idempotently bound to one authenticated customer user ID; its namespace cannot be reassigned to another account. Invalid, mismatched, refunded/revoked-like, and already-used purchases fail closed with short, non-sensitive recovery guidance.
- Standalone passes now include the immutable authenticated owner ID and are accepted only with a valid customer session plus the matching server-side purchase claim. Website-plan passes likewise require the matching customer session.
- The generation API, one-credit rules, atomic reservation, unique purchase/request constraints, job idempotency, ownership filtering, rate limits, provider moderation/availability terms, and callback behavior were not weakened.
- Jobs, status, playback, and downloads require signed owner-scoped access. Provider media URLs and customer details remain absent from client-visible job lists.
- All protected jobs JSON responses and all protected media error responses explicitly use `Cache-Control: private, no-store, max-age=0`; successful protected media responses remain private/no-store and `nosniff`.
- Existing Secure/HttpOnly customer cookies, non-enumerating authentication errors, cross-customer isolation, product prices, entitlements, and provider connections remain unchanged.

### My Websites ownership and deletion protections

- The verified customer session and immutable `owner_id` are authoritative. The narrowly scoped exact-email legacy fallback is available only after server authentication and only for an unowned legacy row; typed email, query parameters, local/session storage, editable site metadata, and a supplied slug never prove ownership.
- Search and management responses remain private/no-store. The management endpoint authenticates before lookup, rate-limits by verified user, rechecks ownership before every mutation, and returns the same non-sensitive failure class for unauthorized access.
- Unpublish and Trash updates are row-ID and owner-ID scoped. Deletion confirmation is recomputed from protected server data; client state cannot choose the expected phrase. Conditional updates provide duplicate-request and stale-state protection.
- Customer-deleted rows are excluded from customer search, editing, draft/publish overwrite, and public rendering. They remain visible only to protected operational/admin recovery tooling.
- Existing subscription transitions cannot silently republish a customer-deleted row. Active billing and AI Video entitlement records remain retained; payment-state transitions continue to update access without clearing Trash.
- The change did not alter product prices, customer cookie settings, Gumroad evidence rules, custom-domain behavior, video-credit accounting, provider connections, or any unrelated RLS policy.

### Browser-draft data separation

- Rename and delete operations use only the existing `cookieDraftSitesIndex` local-storage object. They do not call a server endpoint, send draft content to Supabase, or treat local metadata as account or website ownership proof.
- A backup is addressed by an exact object-property identity. Storage changes rebuild the index while retaining every unselected property and value; a stable active-draft marker prevents a later autosave from colliding with another entry.
- A synchronous action lock, disabled confirmation controls, exact selected-key calculation, and missing-key failure provide duplicate-click and stale-state protection. A failed quota/security write leaves the React list unchanged and reports that no backup was removed.
- Individual, selected, and all-backup cleanup remove the active working copy only when its stable local identity is among the confirmed deleted keys. Unrelated local-storage keys are not enumerated or cleared.
- The feature does not read or write website rows, Trash timestamps, Auth users, sessions, subscriptions, entitlements, payments, Gumroad events, domains, AI Video records, owner records, or provider configuration. Existing server authentication, ownership isolation, rate limits, private/no-store API behavior, and RLS were not changed.

### Password-security availability

The production Supabase organization was verified on the Free plan. Leaked-password protection is not enabled and was documented by Supabase as a Pro-and-above feature at the time of review. No plan upgrade, backup provider, PITR add-on, or secret rotation was purchased or performed.

As verified August 13, 2026, Supabase Pro started at `$25/month` and included seven retained daily backups plus leaked-password protection. Seven-day PITR was listed as a separate `$100/month` add-on. Reverify current pricing and features before purchasing.

## Backup and recovery package

The owner-operated package is documented in `docs/SUPABASE_BACKUP_AND_RECOVERY.md` and implemented by:

- `scripts/backup-supabase.sh`
- `scripts/export-supabase-storage.mjs`
- `scripts/verify-supabase-backup.sh`
- `scripts/restore-supabase-test.sh`
- `scripts/restore-supabase-storage.mjs`

### Coverage

Each successful backup creates a timestamped `age`-encrypted archive and matching SHA-256 checksum. Coverage includes:

- database roles and grants;
- schemas, tables, data, indexes, constraints, sequences, functions, triggers, RLS state/policies, and grants;
- Supabase Auth and application/customer records included in the logical dump;
- Supabase migration-history schema and data;
- a separate Supabase Storage bucket/object inventory;
- Storage object bytes with individual SHA-256 checksums; and
- a manifest tying the package to the production project and UTC timestamp.

Expected encrypted filename format:

```text
mini-builder-supabase-YYYYMMDDTHHMMSSZ.backup.tar.gz.age
mini-builder-supabase-YYYYMMDDTHHMMSSZ.backup.tar.gz.age.sha256
```

Database backups contain Storage metadata but do not restore deleted Storage object bytes. The separate Storage inventory/export is therefore required even when the database dump succeeds. The export remains enabled for future uploads regardless of the inventory at the time of a backup.

The scripts use owner-only temporary permissions, remove plaintext staging files on completion/interruption, reject destinations inside the repository, and reject unapproved production/other-live restore targets. Never put a plaintext or decrypted dump, recovery identity, connection string, service-role key, API key, provider credential, customer record, or Vercel secret export in GitHub, Vercel source, a public bucket, browser storage, screenshots, documentation, or chat.

### Exclusions and separate configuration recovery

The archive does not contain provider-side secret values or configuration, Vercel secret values/scopes, Supabase project settings or generated keys, OAuth/SMTP configuration, Edge Functions, DNS/aliases, Gumroad product/provider records, OpenAI/HeyGen/Resend provider data, or provider billing history.

GitHub `main` remains the source of truth for application code and migrations. Keep a separate encrypted configuration inventory containing only variable name, Vercel scope, verification date, and secret owner. `.env.example` is the repository inventory of required variable names; it must never contain real values. Recovery must restore the existing GitHub/Vercel connection, apply each secret interactively to the correct Production/Preview/Development scope, verify callbacks/webhooks/redirect allowlists, deploy the reviewed `main` commit, confirm the build fingerprint, and inspect runtime logs/advisors before reopening traffic.

### Verification and restore status

The package passed shell/JavaScript syntax checks, secret/artifact review, checksum/manifest structure checks, production-target refusal checks, and repository regression tests. No production dump was created because no owner-controlled private destination or recovery identity was available in the workspace. No production restore was attempted.

An end-to-end data restoration has not yet been executed. It must be validated only in an approved isolated Supabase test project that matches the production PostgreSQL major version and extensions. The restore scripts require the explicit isolated-restore flag, reject both the Mini Builder production project and Cookie Connect, restore transactionally with stop-on-error behavior, restore Storage without overwriting existing objects, and verify restored object checksums.

The isolated restoration checklist must verify schema/grants/policies/triggers, migration history, aggregate row counts, sequences, Storage checksums, Arcade trigger protections, customer isolation, owner-route separation, publishing, checkout/entitlements, DFY routing, support storage, AI Video protections, and the absence of any test callback or webhook path into production.

The My Websites release added migration `20260814153538_customer_website_trash.sql`: two nullable timestamps and one partial Trash index on the existing protected `websites` table. It is additive, idempotent, contains no destructive statement or data rewrite, and left every pre-existing timestamp null. Production migration history, generated types, RLS state, and advisor results were verified afterward. This release did not create a backup because the owner-controlled encrypted destination and recovery identity are still unavailable; the existing first-backup and isolated-restore actions therefore remain open rather than being simulated or stored unsafely.

The browser-draft management release contains no database migration, schema change, Storage operation, or server-data mutation. Browser backups are outside the Supabase recovery package and cannot be restored from its database or Storage archives; recovery depends on the same browser profile retaining its origin-local site data. This phase therefore neither required nor created a production data backup, and it did not change the existing encrypted backup or isolated-restore procedures. The still-open owner-controlled backup and restore drill remains necessary for server-held production data but cannot recover a locally cleared browser draft.

Website Trash recovery is operationally separate from disaster recovery. A retained Trash row has no automatic purge date. A verified admin can restore it to draft by clearing the Trash timestamp through the protected admin update route; republishing also requires active verified access. A customer cannot overwrite or reclaim the protected slug while it remains in Trash. Permanent removal, if ever required, must be a separately reviewed retention/legal operation and must not be implemented as a customer dashboard request.

### Schedule and retention recommendation

For active customer, website, purchase, subscription, Gumroad event, support/request, checkout, and AI Video records:

- create one encrypted backup nightly;
- create backups immediately before and after every production database migration;
- retain 14 daily, 8 weekly, and 12 month-end encrypted backups;
- keep at least one encrypted copy in a separate failure domain;
- verify the newest checksum after each run; and
- run an isolated restore drill monthly and before major launches.

This owner-operated schedule provides an approximate 24-hour recovery-point objective. A smaller provider-managed recovery window requires an approved paid backup/PITR option.

## Data preservation

Pre/post-migration aggregate counts matched for Auth users, Arcade provisioning records, websites, Gumroad events and unresolved-event status, customer requests, AI Video jobs, Cookie AI chat logs, checkout intents, guest-draft claims, and Storage inventory. The account-routing release added only `video_purchase_claims`, a minimal server-only ownership table containing a one-way purchase namespace, authenticated owner ID, purchase-email hash, and timestamps. It has a unique namespace constraint, authenticated-user foreign key, validation checks, row-level security, no public/anonymous/authenticated grants, and service-role-only access. It contained no claim after deployment because verification deliberately did not use the owner's license. Post-migration and post-deployment Auth-user, website, and AI Video-job aggregates matched the pre-deployment baseline. Exact production counts are intentionally excluded from this public repository handoff.

For the My Websites migration, both new columns were verified present, the existing `websites` RLS setting remained enabled, and every pre-existing website row retained null unpublish/Trash markers. Preview and production verification used only signed-out requests, so no customer website was unpublished, deleted, recovered, republished, or otherwise changed. No customer account, plan, purchase, subscription, payment history, custom domain, other website, AI Video, entitlement, or provider connection was modified.

Browser-draft development and destructive test coverage used isolated in-memory JSON fixtures only. Preview and production verification did not inject, rename, delete, duplicate, preview, Continue, or otherwise change a real browser backup. The owner's existing browser collection was not read by the cloud verification browser. No server request was added for browser-backup management, and no Supabase aggregate or row required a change. Published and unpublished websites, recoverable Trash, customer and owner accounts, sessions, subscriptions, entitlements, purchases, payment history, Gumroad data, domains, AI Video plans/jobs/credits/results/media, other local-storage namespaces, and all completed production work were preserved.

No customer account, website, purchase, subscription, Gumroad event, request, checkout, Arcade record, or AI Video record was deleted, reconciled, reassigned, or exposed. Historical unresolved events were preserved. The older preserved workspace was not operated on.

Approved prices and product boundaries remained unchanged: Business `$30/month`, Premium `$50/month`, Extra Page `$10/month`, Done-for-You Extra Page `$125 one-time`, and standalone AI Video `$5 one-time`. Existing paid activation, unmatched-event handling, protected AI Video, DFY, publishing, and checkout protections were preserved.

## Validation results

- Complete automated suite: **330/330 passed**.
- Protected AI Video baseline: **56/56 passed**.
- Focused account-routing matrix: **20/20 passed**, covering every required signed-out, account-return, purchase, claim, result-recovery, duplicate-click, multi-entitlement, and cross-customer scenario.
- Focused My Websites matrix: **20/20 passed**, covering no/one/multiple website states; Published/Unpublished sections; edit/view routing; unpublish, cancel, and republish; recoverable delete, cancel, incorrect confirmation, and duplicate protection; signed-out and cross-customer denial; billing/account/other-website/AI-Video preservation; and mobile, keyboard, focus, screen-reader, and accessible-error behavior.
- Focused browser-draft management matrix: **38/38 passed**, covering zero/one/large collections, exact counts and selection, correct Continue identity, rename validation and duplicate display names, individual/selected/all delete confirmation and cancellation, isolated deletion, immediate count/empty states, duplicate-click protection, all three sort orders, six-card progressive display, corrupt and legacy formats, deliberate Preview/Duplicate omission, server-data preservation, keyboard/screen-reader/focus behavior, and mobile/touch/reduced-motion behavior.
- Supabase TypeScript generation: **passed** against the current production schema during the final readiness pass.
- Next.js production build and TypeScript: **passed**.
- Production build output: **57 pages**.
- Dependency graph and lockfile: **unchanged**; the prior same-lockfile dependency audit reported **0 vulnerabilities**. The final registry-backed audit attempt was blocked by the verification environment's network policy, so no unsupported fresh audit result is claimed.
- Shell and JavaScript validation: **passed**.
- Secret, forbidden-artifact, diff, and plaintext-backup scans: **passed**.
- React client-quality review: no new structural, focus, rendering, state, or fetch-waterfall blocker.
- Vercel preview and production browser checks: **passed** for the non-destructive signed-out surface, headers, existing domains, responsive width, 44-pixel primary control, and application-origin console state. The separate owner-controlled browser-backup confirmation is now also **PASSED**.
- Final readiness recheck: **passed** for the public homepage, `/customer`, `/video-studio`, `/admin/subscriptions`, protected AI Video jobs denial, live fingerprint, production alias state, build-error review, current one-hour runtime-error review, and error/fatal production logs.

Regression coverage preserved owner password access/lock, customer creation/sign-in/sign-out/reset, paid checkout/activation, subscription lifecycle and unmatched events, approved DFY/Gumroad products, contact/support storage, protected AI Video, and prior mobile/accessibility protections. JavaScript syntax, diff whitespace, secret-pattern, and forbidden client-ownership-source checks passed. React review found no new render, effect, focus, state, or request-waterfall blocker.

Production verification confirmed:

- `/customer` rendered the deployed fingerprint with **My Websites**, the requested short explanation, and the simple signed-out state; the verified desktop viewport had no horizontal overflow and its primary sign-in control measured 44 pixels high;
- the preview account dialog received focus and Escape returned focus to **Sign In to My Websites**;
- signed-out `POST /api/site/manage` returned `401` with `Cache-Control: private, no-store, max-age=0` before website lookup or mutation;
- PR `#30` was one reviewed-scope commit, its Vercel preview was `READY`, and it had no review threads or requested changes before squash merge;
- PR `#32` was one reviewed-scope commit affecting seven expected application/test files; it had a successful Vercel check, a `READY` preview, no review threads or requested changes, and was squash-merged after the 330-test/build/security review;
- the browser-draft production deployment `dpl_8ffbrj2YG931w43AsJwLM9rmBWxr` reached `READY` at commit `cf8d347f04a6ceb3478722322c7283272dce4a1e`, served fingerprint `cf8d347f04a6`, retained the wildcard, apex, `www`, and existing Vercel aliases without error, and completed the 57-route build;
- production `/customer` served `200` with the deployed fingerprint, retained `noindex`, rendered the correct signed-out **My Websites** shell, had no horizontal overflow at the verified desktop viewport, and exposed a 44-pixel **Sign In to My Websites** control;
- the preview and production browser sessions recorded no application-origin console errors; the only console entry came from the cloud-browser extension and was excluded from the application result;
- grouped `/customer` runtime errors and deployment-scoped error/fatal logs were empty after verification;
- no authenticated or destructive browser-draft action was performed against production, so no owner backup or server record changed during verification;
- the production deployment was `READY`, used the existing wildcard and primary domains without alias errors, completed its 57-page build without errors, and produced no application error/fatal runtime logs during verification;
- the updated homepage, pricing, policy, and customer-guide routes rendered, with the top navigation and all two homepage, two pricing, and Builder AI Video purchase links using the unified studio route;
- corrected product prices and account-required AI Video entitlement copy appeared;
- Cookie AI opened as a modal, focused the input, trapped keyboard focus, closed with Escape, and returned focus to the launcher;
- customer and AI Video private routes remained excluded from indexing;
- retired launch/owner pages redirected to protected admin access;
- signed-out `/admin/subscriptions` showed only the secure owner form and no protected records;
- protected APIs returned private/no-store unauthorized responses while signed out;
- signed-out `/video-studio` returned `200`, private/no-store HTML, the deployed build fingerprint, the expected five-stage progress and **Create Your AI Video** content, and only **Create My Account** and **Sign In** account actions—without a license field or external checkout link;
- direct signed-out `/checkout/ai-video` performed the account check and exposed neither the external Gumroad URL nor a secure-checkout button;
- `/checkout/success?paid=ai-video` used truthful non-proof wording and offered account creation/sign-in when the session was missing;
- signed-out `/video-studio/results` returned `200` with account creation/sign-in recovery and without the retired email, website-verification, or license forms;
- signed-out jobs and protected-media requests returned safe `401` responses with explicit private/no-store cache headers;
- the production alias and bare-domain redirect remained correct, while the existing preview and production projects/domains were reused;
- the deployed AI Video routes produced no grouped runtime errors and no error/fatal runtime logs during verification;
- the existing public domains remained assigned without alias errors; and
- the final deployment had no build errors, application runtime error/fatal logs, or application-origin browser-console errors.

## Supabase advisor comparison and unresolved technical items

Resolved:

- anonymous direct execution warning for `handle_new_arcade_user()`;
- authenticated direct execution warning for `handle_new_arcade_user()`.

Still open or informational:

- leaked-password protection remains disabled on the Free plan;
- informational RLS-with-no-policy notices remain on intentionally server-only tables;
- the performance advisor still reports one unindexed foreign key and existing unused-index notices;
- the new partial Trash index is reported as unused immediately after creation, which is expected before any customer website enters Trash;
- the first encrypted production backup has not been created;
- the first isolated restore drill has not been run;
- browser-only backups remain vulnerable to local site-data clearing, private-session disposal, storage pressure, and browser eviction and are not recoverable from Supabase backups;
- read-only Preview and collision-proof Duplicate remain intentionally unavailable until a future versioned storage design can guarantee those properties without migrating or risking legacy backups;
- a fresh online dependency audit could not reach the package registry in the verification environment; the lockfile/dependency graph did not change and the prior same-lockfile audit remains zero vulnerabilities;
- qualified legal review remains outside the Builder-owned technical verification; and
- the first post-launch monitoring pass was completed during this final readiness review, while the recurring monitoring schedule should begin after the first encrypted backup is safely stored.

No unrelated index, RLS, data-reconciliation, provider-configuration, OAuth, DNS, or secret-rotation change was made merely to clear an advisor notice.

## Owner Action Required

Only these owner-controlled recovery actions remain:

1. On a trusted computer, create and privately retain the `age` recovery identity, choose a private encrypted backup destination outside the GitHub repository, set the documented backup variables without sharing their values, run the first encrypted production backup, and verify its checksum.
2. Approve or provide an isolated Supabase test project that is not Mini Builder production and not Cookie Connect, then run the documented guarded restore drill using the owner-held identity and verify the restore checklist.

Do not place the recovery identity, database password, service-role key, plaintext dump, encrypted archive, or provider secret in GitHub, this workspace, chat, or a public/shared location. Do not restore into production for this drill.

The browser-draft, AI Video purchase-recovery/result, My Websites management, owner-login, customer-account, subscription, Gumroad, DFY, and edit/republish confirmations are **PASSED**. Do not repeat them unless a verified regression is reported.
