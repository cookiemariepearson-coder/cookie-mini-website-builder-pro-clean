# Cookie Mini Website Builder Pro — Production Handoff

Last updated: August 14, 2026

This document is the consolidated handoff for the completed owner-authentication, launch-security, backup/recovery, Cookie AI, accessibility/mobile, SEO, policy-consistency, and soft-launch technical-readiness work. It records the verified production state without storing credentials, secret values, customer details, database dumps, recovery material, provider project identifiers, or exact production record counts. Those operational values must be read only from the authorized provider dashboards and encrypted owner records.

## Authoritative production baseline

- Repository: `cookiemariepearson-coder/cookie-mini-website-builder-pro-clean`
- Source-of-truth branch: `main`
- Completed implementation PR: `#23` — Harden launch security and recovery
- Starting production commit: `440e72683ec6708fff7b63887379837380736681`
- Reviewed feature commit: `956c65b2b4034c8ffb4c9e1e58feebe1d6b78ab7`
- Production merge commit: `a23d34493fed112541b62628ea98a8299e9b9374`
- Vercel production deployment state: `READY`
- Live build fingerprint: `a23d34493fed`
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

Pre/post-migration aggregate counts matched for Auth users, Arcade provisioning records, websites, Gumroad events and unresolved-event status, customer requests, AI Video jobs, Cookie AI chat logs, checkout intents, guest-draft claims, and Storage inventory. Exact production counts are intentionally excluded from this public repository handoff.

No customer account, website, purchase, subscription, Gumroad event, request, checkout, Arcade record, or AI Video record was deleted, reconciled, reassigned, or exposed. Historical unresolved events were preserved. The older preserved workspace was not operated on.

Approved prices and product boundaries remained unchanged: Business `$30/month`, Premium `$50/month`, Extra Page `$10/month`, Done-for-You Extra Page `$125 one-time`, and standalone AI Video `$5 one-time`. Existing paid activation, unmatched-event handling, protected AI Video, DFY, publishing, and checkout protections were preserved.

## Validation results

- Complete automated suite: **232/232 passed**.
- Protected AI Video baseline: **56/56 passed**.
- Focused new security/readiness checks: **11/11 passed**.
- Supabase TypeScript generation: **passed**.
- Next.js production build and TypeScript: **passed**.
- Production build output: **57 pages**.
- Dependency audit: **0 vulnerabilities**.
- Shell and JavaScript validation: **passed**.
- Secret, forbidden-artifact, diff, and plaintext-backup scans: **passed**.
- React client-quality review: no new structural, focus, rendering, state, or fetch-waterfall blocker.

Regression coverage preserved owner password access/lock, customer creation/sign-in/sign-out/reset, My Websites ownership and cross-customer isolation, edit/republish, paid checkout/activation, subscription lifecycle and unmatched events, approved DFY/Gumroad products, contact/support storage, protected AI Video, and prior mobile/accessibility protections.

Production verification confirmed:

- the updated homepage, pricing, policy, and customer-guide routes rendered;
- corrected product prices and AI Video entitlement copy appeared;
- Cookie AI opened as a modal, focused the input, trapped keyboard focus, closed with Escape, and returned focus to the launcher;
- customer and AI Video private routes remained excluded from indexing;
- retired launch/owner pages redirected to protected admin access;
- signed-out `/admin/subscriptions` showed only the secure owner form and no protected records;
- protected APIs returned private/no-store unauthorized responses while signed out;
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
- the first encrypted production backup has not been created;
- the first isolated restore drill has not been run;
- qualified legal review has not been completed; and
- the documented soft-launch monitoring routine should begin after the first encrypted backup is safely stored.

No unrelated index, RLS, data-reconciliation, provider-configuration, OAuth, DNS, or secret-rotation change was made merely to clear an advisor notice.

## Owner Action Required

Only these owner-controlled actions remain:

1. On a trusted computer, create and protect the `age` recovery identity, choose a private encrypted off-repository destination, run the first encrypted backup, verify its checksum, and approve an isolated test project for the first restore drill.
2. Decide whether to upgrade Supabase for managed daily backups and leaked-password protection, and whether the separate PITR add-on is justified. Reverify current pricing before approval; no purchase should occur automatically.
3. Obtain qualified legal review before a broad public launch. The completed policy review was a technical consistency/security review, not legal advice.

Do not repeat the completed owner-login, account, purchase, subscription, Gumroad, DFY, or AI Video journeys unless a verified regression is reported.
