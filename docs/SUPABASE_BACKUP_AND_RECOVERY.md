# Mini Builder Supabase Backup and Recovery

Last reviewed: August 13, 2026

Production project: `Cookie Mini Website Builder Pro-2` (`ghugpztxhrrdonaerwms`, US East 2, PostgreSQL 17)

## Current recovery posture

The organization is on the Supabase Free plan. Free projects do not include managed automatic backups, Point-in-Time Recovery, or leaked-password protection. This package provides an owner-operated logical backup until a paid plan is approved.

Never write a production connection string, database password, service-role key, API key, plaintext dump, decrypted Storage object, or Vercel environment-value export into this repository. Run backups only on a trusted computer. Put the destination on private encrypted storage outside the repository.

## Backup coverage

`scripts/backup-supabase.sh` creates one timestamped, age-encrypted archive containing:

- database roles and grants (`roles.sql`);
- schemas, tables, indexes, constraints, functions, triggers, RLS policies, and grants (`schema.sql`);
- database data, including application and Auth records (`data.sql`);
- Supabase migration-history schema and data;
- a separate Storage bucket/object inventory;
- the bytes for every Storage object, with an individual SHA-256 checksum; and
- a package manifest tying the files to the production project and UTC timestamp.

Supabase database dumps contain Storage metadata, not the underlying object bytes. The Storage export in this package is therefore required even when the database dump succeeds. The live inventory on August 13, 2026 contained zero Storage buckets and zero objects, but the export remains enabled for future uploads.

The package does not capture Vercel secret values, Supabase project settings, JWT/API keys, OAuth configuration, SMTP configuration, Edge Functions, DNS, Vercel aliases, Gumroad product/provider data, OpenAI/HeyGen/Resend provider data, or provider-side billing history. Those are covered by the configuration recovery section below.

## One-time trusted-computer setup

Install Docker Desktop, the current Supabase CLI, Node.js 24, `age`, `tar`, and `sha256sum`. Verify commands with `--help` before the first run.

Create an age identity once on the trusted computer:

```bash
age-keygen -o /private/offline/location/mini-builder-backup-identity.txt
```

Keep that identity file off the web server and out of GitHub. Store a second protected recovery copy in an encrypted password manager or offline encrypted drive. Record only its public `age1...` recipient in the scheduler configuration.

Provide secrets as environment variables or secure interactive prompts. Do not paste them into scripts or shell history:

- `SUPABASE_PROJECT_REF=ghugpztxhrrdonaerwms`
- `SUPABASE_DB_URL` — the production Session pooler or direct connection string;
- `SUPABASE_URL` — the production project API URL;
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used to inventory and download Storage;
- `BACKUP_DESTINATION` — private directory outside the Git repository; and
- `BACKUP_AGE_RECIPIENT` — the public age recipient.

Run:

```bash
./scripts/backup-supabase.sh
```

The result uses `mini-builder-supabase-YYYYMMDDTHHMMSSZ.backup.tar.gz.age` and a matching `.sha256` file. Plaintext staging files are created with owner-only permissions and removed on completion or interruption. The script refuses a destination inside the repository and refuses any project ref other than production.

## Checksum and decryption verification

Set `BACKUP_AGE_IDENTITY_FILE` to the private identity-file path, then run:

```bash
./scripts/verify-supabase-backup.sh \
  /private/backups/mini-builder-supabase-YYYYMMDDTHHMMSSZ.backup.tar.gz.age \
  /private/backups/mini-builder-supabase-YYYYMMDDTHHMMSSZ.backup.tar.gz.age.sha256
```

This verifies the encrypted-file checksum, decrypts only into a locked temporary directory, validates the expected database files and JSON inventories, and then removes plaintext automatically.

## Schedule, retention, and rotation

For active customer, purchase, website, subscription, request, event, and AI Video records:

- run an encrypted backup every night;
- run another immediately before and after a production database migration;
- keep 14 daily backups, 8 weekly backups, and 12 month-end backups;
- keep at least one encrypted copy in a separate physical or cloud failure domain;
- verify the newest checksum after every run; and
- perform an isolated restore drill monthly and before major launches.

This nightly schedule has an approximate 24-hour recovery-point objective. A paid Supabase plan or PITR is needed for a smaller platform-managed recovery window.

Rotation must delete only explicitly resolved, expired encrypted archives from the private destination. Never script deletion against a broad directory, `$HOME`, or a repository root.

## Restore only to an isolated test project

Never test a restore against production. The restore guard rejects the production project ref and requires `ALLOW_ISOLATED_RESTORE=YES`.

1. Obtain approval for a temporary isolated target. Do not reuse Cookie Connect or another live project.
2. Match the production PostgreSQL major version and enable the same extensions.
3. Set `RESTORE_TARGET_PROJECT_REF`, `RESTORE_TARGET_DB_URL`, and `BACKUP_AGE_IDENTITY_FILE` through a secure environment.
4. Set `RESTORE_TARGET_SUPABASE_URL` and `RESTORE_TARGET_SERVICE_ROLE_KEY` for the same isolated project.
5. Run `scripts/restore-supabase-test.sh` with the encrypted archive and checksum. It restores the database, then restores and checksum-verifies Storage before deleting its temporary plaintext.
6. Do not point production domains, Gumroad webhooks, email delivery, OAuth callbacks, cron jobs, or provider keys at the test project.
7. Destroy the isolated test project only after recording non-sensitive verification results and receiving the appropriate approval.

The official logical restore uses `psql --single-transaction`, `ON_ERROR_STOP=1`, roles, schema, `session_replication_role=replica`, then data. Custom Auth/Storage schema changes and migration history require explicit verification because those are managed schemas.

## Restoration verification checklist

- Encrypted archive checksum passes before decryption.
- Manifest project ref and timestamp match the selected backup.
- Roles, schema, data, and migration-history files exist and are non-empty.
- Restore completes in one transaction without ignored SQL errors.
- Expected extensions are enabled without pinning extension versions.
- Tables, views, functions, triggers, RLS state, policies, and grants match the source structural inventory.
- `handle_new_arcade_user()` remains a protected trigger and cannot be called by `PUBLIC`, `anon`, `authenticated`, or `service_role`.
- Aggregate row counts match for Auth users, websites, Gumroad events, requests, checkout intents, continuations, video jobs, and Arcade tables.
- Sequence values are at least each table's current maximum key.
- Storage bucket count, object count, total bytes, and every restored object checksum match `storage/inventory.json`.
- A controlled test customer can sign in and see only that customer's test data.
- Owner routes remain separate, private, and locked without the owner cookie.
- Publishing, subscription entitlements, DFY routing, support storage, and AI Video protections pass against the isolated target.
- No test endpoint, callback, alias, email sender, or webhook can affect production.

## Vercel and application-configuration recovery

GitHub `main` is the source of truth for application code and database migrations. Keep a separate encrypted configuration inventory that records variable name, Vercel scope, last verification date, and secret owner—never the plaintext value in GitHub.

Required variable names are maintained in `.env.example`. Recovery must cover:

- public root-domain and Supabase URL settings;
- Supabase service-role credential;
- OpenAI and HeyGen configuration;
- video-access signing secret;
- Gumroad API/webhook/product configuration;
- Resend sender configuration;
- owner/support notification addresses;
- monthly checkout destinations;
- all approved DFY checkout destinations; and
- monthly AI Video allowances.

In a recovery:

1. Restore or recreate only the existing Vercel project and GitHub connection; do not create an unrelated repository or OAuth connection.
2. Enter secret values interactively in the Vercel dashboard or CLI so they do not appear in command history.
3. Apply each variable to its intended Production/Preview/Development scope.
4. Confirm Preview cannot use production-only provider actions unintentionally.
5. Deploy the exact reviewed `main` commit and verify its `x-cookie-build` fingerprint.
6. Reattach the existing production domains only after the isolated application checks pass.
7. Verify Supabase Auth redirect allowlists, Gumroad webhooks, Resend sender/domain, and provider callbacks without exposing their secrets.
8. Review Vercel build/runtime logs and Supabase advisors before reopening customer traffic.

## Emergency recovery order

1. Stop the damaging write path without deleting records.
2. Preserve logs and create a fresh encrypted backup if the database remains readable.
3. Identify the last verified archive and checksum.
4. Prove the restore in an isolated target.
5. Compare schema, grants, counts, Storage checksums, and application flows.
6. Obtain owner approval before any production restore, paid upgrade, DNS change, or secret rotation.
7. Restore production only through an approved maintenance plan, then verify every protected flow and monitor logs.

## Current paid option

As verified August 13, 2026, Supabase Pro starts at $25/month and includes leaked-password protection plus daily backups retained for seven days. PITR is a separate add-on listed at $100/month per seven days of retention. No upgrade or add-on was purchased during this phase.
