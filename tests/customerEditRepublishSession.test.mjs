import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { siteBelongsToEmail, siteBelongsToOwner } from '../lib/siteOwnership.mjs';
import { safeCustomerReturnPath } from '../lib/commerceConfig.mjs';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('signed-in owner identity matches an owned website by immutable Supabase user id', () => {
  const row = { owner_id: 'owner-a', customer_email: 'owner@example.com' };
  assert.equal(siteBelongsToOwner(row, { user: { id: 'owner-a' }, email: 'owner@example.com' }), true);
});

test('different customer is blocked even when client-visible email text is forged', () => {
  const row = { owner_id: 'owner-a', customer_email: 'owner@example.com', site: { customerEmail: 'other@example.com' } };
  assert.equal(siteBelongsToOwner(row, { user: { id: 'owner-b' }, email: 'owner@example.com' }), false);
});

test('legacy migration fallback requires an unowned row and exact verified email', () => {
  const legacy = { owner_id: null, customer_email: 'Legacy@Example.com' };
  assert.equal(siteBelongsToEmail(legacy, 'legacy@example.com'), true);
  assert.equal(siteBelongsToOwner(legacy, { user: { id: 'owner-a' }, email: 'legacy@example.com' }), true);
  assert.equal(siteBelongsToOwner(legacy, { user: { id: 'owner-b' }, email: 'different@example.com' }), false);
});

test('customer editor uses the secure same-origin cookie rather than retired browser auth', async () => {
  const editor = await source('app/customer/edit/[slug]/page.js');
  assert.match(editor, /credentials: 'same-origin'/);
  assert.match(editor, /useAccountModal/);
  assert.match(editor, /accountState !== 'signed-in'/);
  assert.doesNotMatch(editor, /cookieSiteOwnerAccessToken|AUTH_TOKEN_KEY|localStorage\.getItem|Authorization:/);
});

test('signed-out editor access opens password sign-in with a validated return path', async () => {
  const [editor, modal, commerce] = await Promise.all([
    source('app/customer/edit/[slug]/page.js'),
    source('components/AccountModalProvider.js'),
    source('lib/commerceConfig.mjs')
  ]);
  assert.match(editor, /Sign In and Return to Editor/);
  assert.match(editor, /openAccountModal\(\{ mode: 'signin', destination: editorPath\(slug\) \}\)/);
  const safeEditorPathCheck = "if (/^\\/customer\\/edit\\/[a-z0-9-]+$/.test(path)) return path;";
  assert.ok(modal.includes(safeEditorPathCheck));
  assert.ok(commerce.includes(safeEditorPathCheck));
  assert.equal(safeCustomerReturnPath('/customer/edit/my-safe-site'), '/customer/edit/my-safe-site');
  assert.equal(safeCustomerReturnPath('/customer/edit/../../admin'), '/customer');
});

test('owner-only load authenticates before lookup and never caches private website data', async () => {
  const route = await source('app/api/site/get/route.js');
  const authIndex = route.indexOf('if (ownerOnly)');
  const lookupIndex = route.indexOf("from('websites')");
  assert.ok(authIndex >= 0 && lookupIndex > authIndex);
  assert.match(route, /getVerifiedSiteOwner\(req\)/);
  assert.match(route, /siteBelongsToOwner\(data, owner\)/);
  assert.match(route, /private, no-store, max-age=0/);
});

test('republish rechecks ownership and atomically scopes the update to the verified owner', async () => {
  const route = await source('app/api/site/save/route.js');
  assert.match(route, /getVerifiedSiteOwner\(req\)/);
  assert.match(route, /siteBelongsToOwner\(existing, owner\)/);
  assert.match(route, /\.eq\('id', existing\.id\)/);
  assert.match(route, /updateQuery\.eq\('owner_id', owner\.user\.id\)/);
  assert.match(route, /\.is\('owner_id', null\)\.ilike\('customer_email', owner\.email\)/);
  assert.match(route, /You do not have access to republish this website/);
});

test('archive and delete remain owner-only while safely claiming exact legacy ownership', async () => {
  const route = await source('app/api/site/manage/route.js');
  assert.match(route, /getVerifiedSiteOwner\(request\)/);
  assert.match(route, /siteBelongsToOwner\(foundSite, owner\)/);
  assert.match(route, /\.is\('owner_id', null\)/);
  assert.match(route, /\.ilike\('customer_email', owner\.email\)/);
  assert.match(route, /\.eq\('owner_id', owner\.user\.id\)/);
});

test('customer search ignores typed email and returns only owned or exact legacy rows', async () => {
  const route = await source('app/api/site/search/route.js');
  assert.match(route, /const email = owner\.email/);
  assert.doesNotMatch(route, /body\.email/);
  assert.match(route, /\.eq\('owner_id', owner\.user\.id\)/);
  assert.match(route, /\.is\('owner_id', null\)\.eq\('customer_email', email\)/);
});

test('normal editor navigation preserves the server session and sign-out removes access', async () => {
  const [editor, provider, signout] = await Promise.all([
    source('app/customer/edit/[slug]/page.js'),
    source('components/AccountModalProvider.js'),
    source('app/api/auth/site-owner/signout/route.js')
  ]);
  assert.doesNotMatch(editor, /signout|removeItem\(/i);
  assert.match(provider, /fetch\('\/api\/auth\/site-owner\/session'/);
  assert.match(signout, /maxAge: 0/);
  assert.match(provider, /setAccountState\('signed-out'\)/);
});

test('legacy token adoption is isolated to session migration and does not drive editor ownership', async () => {
  const [editor, provider, session] = await Promise.all([
    source('app/customer/edit/[slug]/page.js'),
    source('components/AccountModalProvider.js'),
    source('app/api/auth/site-owner/session/route.js')
  ]);
  assert.doesNotMatch(editor, /LEGACY_AUTH_TOKEN_KEY|Authorization/);
  assert.match(provider, /LEGACY_AUTH_TOKEN_KEY/);
  assert.match(provider, /localStorage\.removeItem\(LEGACY_AUTH_TOKEN_KEY\)/);
  assert.match(session, /owner\.migratedBearer/);
  assert.match(session, /response\.cookies\.set/);
});

test('checkout intent survives password authentication unchanged', async () => {
  const [continuation, modal] = await Promise.all([
    source('app/checkout/continue/page.js'),
    source('components/AccountModalProvider.js')
  ]);
  assert.match(continuation, /\/api\/checkout\/intent\/status/);
  assert.match(continuation, /\/api\/checkout\/intent\/resume/);
  assert.match(continuation, /openAccountModal/);
  assert.match(modal, /\^\\\/checkout\\\/continue\\\?intent=/);
});

test('Account supports secure sign-in and return without exposing an external redirect', async () => {
  const [account, provider] = await Promise.all([
    source('app/customer/account/page.js'),
    source('components/AccountModalProvider.js')
  ]);
  assert.match(account, /Sign In and Return to Account/);
  assert.match(account, /destination: '\/customer\/account'/);
  assert.match(provider, /path === '\/customer\/account'/);
  assert.equal(safeCustomerReturnPath('/customer/account'), '/customer/account');
});
