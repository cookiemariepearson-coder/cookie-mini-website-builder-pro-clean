# Launch Security and Recovery Review

Last reviewed: August 13, 2026

## Owner-password phase

PASSED by owner production verification. The owner received the latest approved recovery email, set a new password, opened `/admin/subscriptions`, loaded the protected dashboard, locked the dashboard, confirmed access was removed, and signed in again with the new password. No recovery email or identity change was made during this phase.

## Backup and recovery

The Builder now has encrypted logical-backup, checksum-verification, Storage inventory/export, and isolated-restore tooling documented in `SUPABASE_BACKUP_AND_RECOVERY.md`. The scripts refuse the production and Cookie Connect projects as restore targets. Source and shell/JavaScript structural checks passed. No production dump was created because a private off-repository destination and owner-held age identity are intentionally not available in the application workspace. No production restore was attempted.

Current production Storage inventory: 0 buckets and 0 objects. Storage export remains mandatory because database dumps contain Storage metadata rather than deleted object bytes.

## `handle_new_arcade_user()` investigation

- Project: Cookie Mini Website Builder Pro-2 (`ghugpztxhrrdonaerwms`), not Cookie Connect.
- Schema/owner/language: `public`, `postgres`, `plpgsql`.
- Purpose: Joy House Arcade provisioning after a new `auth.users` row.
- Trigger: enabled `on_arcade_user_created`, `AFTER INSERT ON auth.users FOR EACH ROW`.
- Writes: one profile, wallet, and progress record, all idempotent with `ON CONFLICT DO NOTHING`.
- Authorization data: user metadata affects display names only; it does not grant Builder, customer, or owner access.
- Builder callers: none in the Mini Builder source. The function is invoked by the database trigger.
- Cookie Connect: no matching function or Arcade tables in project `bxwcyrhnesqajlxopvzy`.
- Before: `SECURITY DEFINER`, owner `postgres`, `search_path=public`, and direct execution available to `PUBLIC`, `anon`, `authenticated`, and `service_role`. Supabase reported both anonymous and signed-in Data API RPC warnings.
- After: `SECURITY DEFINER`, owner unchanged, `search_path=''`, all built-ins/schema objects explicitly qualified, direct execution denied to `PUBLIC`, `anon`, `authenticated`, and `service_role`, and execution retained only for `postgres` and `supabase_auth_admin`.

Migration `20260813175119_restrict_arcade_user_trigger_function.sql` is recorded in production migration history. The neighboring rollback SQL restores the previous search path and grants. The function body’s provisioning behavior and the enabled Auth trigger were preserved.

The security-advisor comparison removed both function-exposure warnings. Existing INFO notices for server-only RLS tables and the Free-plan leaked-password warning remain. The performance-advisor list was unchanged; unrelated index cleanup was not included in this focused migration.

## Data-preservation evidence

Aggregate counts immediately before and after the migration were unchanged:

- 6 Auth users;
- 6 Arcade profiles, 6 wallets, and 6 progress records;
- 25 websites;
- 16 Gumroad events, including 4 unresolved historical events;
- 15 customer requests;
- 8 AI Video jobs;
- 52 Cookie AI chat-log records;
- 27 checkout intents;
- 3 guest-draft claims; and
- 0 Storage buckets and 0 Storage objects.

No customer, website, purchase, subscription, event, request, Arcade, or AI Video record was deleted or reconciled.

## Password security

The Supabase organization is on the Free plan. Minimum 10-character passwords, non-enumerating errors, server-side attempt limits, recovery throttles, separate Secure/HttpOnly/SameSite customer and owner cookies, and explicit-only recovery remain in code and regression coverage. Leaked-password protection is not enabled because Supabase lists it for Pro and above; no upgrade was purchased.

## Final launch-readiness repairs

- Corrected all found public $5 AI Video copy to match the protected one-real-video entitlement.
- Prioritized video-script requests as AI Video intent and labeled Builder draft context as untrusted data in the model prompt.
- Added Cookie AI dialog semantics, Escape handling, focus containment/restoration, visible focus, mobile dynamic-viewport sizing, and an optional-data privacy notice.
- Replaced public copy that implied typed email could identify a customer with verified-session/My Websites wording.
- Added public-page canonical metadata, stable sitemap timestamps, and SoftwareApplication/Organization structured data.
- Redirected stale public owner launch/test checklists to protected `/admin` access.
- Clarified subscription policy so paid entitlement changes require authoritative provider evidence and protected reconciliation.
- Updated the Privacy Policy for Cookie AI logging and clarified that browser storage never grants protected access.
- Updated the `nanoid` override to the first patched 3.x release after a new high-severity advisory was detected; the final dependency audit reports zero vulnerabilities.

Qualified legal review remains advisable before a broad public launch; the policy consistency and technical-security review in this phase are not legal advice.
