import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('backup package encrypts outside the repository and retains no plaintext dump', async () => {
  const backup = await source('scripts/backup-supabase.sh');
  assert.match(backup, /EXPECTED_PROJECT_REF="ghugpztxhrrdonaerwms"/);
  assert.match(backup, /Backup destination must be outside the Git repository/);
  assert.match(backup, /age --encrypt --recipient/);
  assert.match(backup, /sha256sum/);
  assert.match(backup, /trap cleanup EXIT INT TERM/);
  assert.match(backup, /--role-only/);
  assert.match(backup, /--data-only/);
  assert.match(backup, /--schema supabase_migrations/);
  assert.doesNotMatch(backup, /SUPABASE_SERVICE_ROLE_KEY=/);
});

test('restore tooling refuses production and requires an explicit isolated target', async () => {
  const [databaseRestore, storageRestore] = await Promise.all([
    source('scripts/restore-supabase-test.sh'),
    source('scripts/restore-supabase-storage.mjs')
  ]);
  for (const restore of [databaseRestore, storageRestore]) {
    assert.match(restore, /ALLOW_ISOLATED_RESTORE/);
    assert.match(restore, /ghugpztxhrrdonaerwms/);
    assert.match(restore, /Refusing to restore/);
  }
  assert.match(databaseRestore, /--single-transaction/);
  assert.match(databaseRestore, /ON_ERROR_STOP=1/);
  assert.match(databaseRestore, /COOKIE_CONNECT_PROJECT_REF/);
  assert.match(databaseRestore, /manifest\.projectRef !== expectedRef/);
  assert.match(storageRestore, /restoredChecksum !== object\.sha256/);
  assert.match(storageRestore, /upsert: false/);
  assert.match(storageRestore, /cookieConnectProjectRef/);
  assert.match(storageRestore, /safeBucketDirectory/);
});

test('Arcade auth trigger migration preserves provisioning but removes direct RPC execution', async () => {
  const [migration, rollback] = await Promise.all([
    source('supabase/migrations/20260813175119_restrict_arcade_user_trigger_function.sql'),
    source('supabase/rollbacks/20260813175119_restrict_arcade_user_trigger_function.rollback.sql')
  ]);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /insert into public\.arcade_profiles/i);
  assert.match(migration, /insert into public\.arcade_wallets/i);
  assert.match(migration, /insert into public\.arcade_progress/i);
  assert.match(migration, /revoke all on function public\.handle_new_arcade_user\(\) from public/i);
  assert.match(migration, /revoke execute .* anon, authenticated, service_role/i);
  assert.match(migration, /grant execute .* supabase_auth_admin/i);
  assert.match(rollback, /grant execute .* public, anon, authenticated, service_role/i);
});
