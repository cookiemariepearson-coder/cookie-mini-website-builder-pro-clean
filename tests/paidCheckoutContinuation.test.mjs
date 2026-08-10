import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  checkoutIntentBelongsToOwner,
  checkoutIntentBuilderPath,
  checkoutIntentEmailHash,
  checkoutIntentRequestFromReturnPath,
  newWebsiteCheckoutIntent,
  normalizeWebsiteCheckoutPlan,
  websiteCheckoutIntentState
} from '../lib/websiteCheckoutIntent.mjs';

const NOW = Date.parse('2026-08-10T12:00:00Z');
const ID = '11111111-1111-4111-8111-111111111111';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function intent(patch = {}) {
  return {
    ...newWebsiteCheckoutIntent({ id: ID, plan: 'business', draftSlug: 'cookies-kitchen', email: 'owner@example.com', now: NOW }),
    ...patch
  };
}

test('1. selected paid plan is fixed in a server intent before authentication', () => {
  const row = intent();
  assert.equal(row.plan, 'business');
  assert.equal(row.draft_slug, 'cookies-kitchen');
  assert.equal(row.status, 'pending_auth');
});

test('2. same-browser callback resumes through the opaque intent rather than dashboard state', () => {
  assert.equal(checkoutIntentBuilderPath(intent(), { resume: true }), `/builder?checkoutIntent=${ID}&draft=cookies-kitchen&resumeCheckout=1`);
});

test('3. cross-browser email link needs no localStorage plan or draft', () => {
  const row = intent();
  assert.equal(row.email_hash, checkoutIntentEmailHash('OWNER@example.com'));
  assert.doesNotMatch(JSON.stringify(row), /owner@example\.com/i);
  assert.equal(websiteCheckoutIntentState(row, NOW + 60_000).plan, 'business');
});

test('4. wrong customer cannot resume another customer intent', () => {
  const row = intent({ owner_id: 'owner-a', status: 'ready' });
  assert.equal(checkoutIntentBelongsToOwner(row, { id: 'owner-a', email: 'owner@example.com' }), true);
  assert.equal(checkoutIntentBelongsToOwner(row, { id: 'owner-b', email: 'other@example.com' }), false);
});

test('5. changing a plan query cannot change the server-authoritative product', () => {
  const row = intent();
  const attackerQuery = checkoutIntentRequestFromReturnPath('/builder?checkout=premium&draft=attacker-site');
  assert.equal(attackerQuery.plan, 'premium');
  assert.equal(websiteCheckoutIntentState(row, NOW + 60_000).plan, 'business');
});

test('6. changing the website identifier cannot transfer the intent', () => {
  const row = intent();
  assert.equal(websiteCheckoutIntentState(row, NOW + 60_000).draftSlug, 'cookies-kitchen');
  assert.notEqual(websiteCheckoutIntentState(row, NOW + 60_000).draftSlug, 'other-site');
});

test('6a. final draft slug is prepared server-side before authentication without changing the plan', async () => {
  const [builder, startRoute] = await Promise.all([
    source('app/builder/page.js'),
    source('app/api/checkout/intent/start/route.js')
  ]);
  assert.match(builder, /body: JSON\.stringify\(\{ plan, draftSlug, intentId \}\)/);
  assert.match(startRoute, /requestedPlan !== state\.plan/);
  assert.match(startRoute, /update\(\{ draft_slug: draftSlug \}\)/);
  assert.match(startRoute, /\.is\('owner_id', null\)/);
  assert.match(startRoute, /\.is\('email_hash', null\)/);
});

test('7. expired intent fails safely', () => {
  assert.deepEqual(websiteCheckoutIntentState(intent(), NOW + (3 * 60 * 60 * 1000)), { ok: false, reason: 'expired' });
});

test('8. replayed intent fails before another checkout handoff', () => {
  assert.deepEqual(websiteCheckoutIntentState(intent({ status: 'checkout_started' }), NOW + 60_000), { ok: false, reason: 'used' });
});

test('9. AI Video cannot become a website checkout intent', () => {
  assert.equal(normalizeWebsiteCheckoutPlan('ai-video'), '');
  assert.equal(newWebsiteCheckoutIntent({ id: ID, plan: 'ai-video', now: NOW }), null);
});

test('10. Extra Page remains bound to only its exact configured route', () => {
  const row = newWebsiteCheckoutIntent({ id: ID, plan: 'extra', draftSlug: 'cookies-kitchen', now: NOW });
  assert.equal(websiteCheckoutIntentState(row, NOW + 60_000).checkoutPath, '/checkout/extra');
});

test('11. auth callback and dashboard fallback both resume the durable intent', async () => {
  const [callback, customer] = await Promise.all([
    source('app/customer/auth/callback/page.js'),
    source('app/customer/page.js')
  ]);
  assert.match(callback, /fetch\('\/api\/checkout\/intent\/resume'/);
  assert.match(customer, /window\.location\.hash/);
  assert.match(customer, /fetch\('\/api\/checkout\/intent\/active'/);
  assert.match(customer, /Continue Purchase/);
});

test('12. already-authenticated Builder uses the same server continuation route', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /ensureCheckoutIntent\(site\.plan, draftSlug, existingIntentId\)/);
  assert.match(builder, /fetch\('\/api\/checkout\/intent\/continue'/);
  assert.match(builder, /onClick=\{\(\) => checkoutPlan\(\)\}/, 'React click event must not be mistaken for an existing checkout intent');
  assert.doesNotMatch(builder, /onClick=\{checkoutPlan\}/, 'direct event binding would pass a circular HTML event into persisted checkout state');
  assert.doesNotMatch(builder, /window\.location\.href = websiteCheckoutRoute\(site\.plan\)/);
});

test('13. resume and continue routes enforce verified owner and website ownership', async () => {
  const [resume, continuation] = await Promise.all([
    source('app/api/checkout/intent/resume/route.js'),
    source('app/api/checkout/intent/continue/route.js')
  ]);
  for (const route of [resume, continuation]) {
    assert.match(route, /getVerifiedSiteOwner/);
    assert.match(route, /siteBelongsToOwner/);
    assert.match(route, /checkoutIntentBelongsToOwner/);
  }
});

test('14. missing checkout configuration is visible but does not expose the setting name to customers', async () => {
  const continuation = await source('app/api/checkout/intent/continue/route.js');
  assert.match(continuation, /checkout configuration missing/);
  assert.match(continuation, /environmentVariable: config\.envName/);
  assert.match(continuation, /Secure checkout is temporarily unavailable\. Your draft and plan selection are still saved\./);
  assert.doesNotMatch(continuation, /error: config\.envName/);
});

test('15. durable intent table is server-only and protected by RLS', async () => {
  const migration = await source('supabase/website_checkout_intents_migration.sql');
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.website_checkout_intents from anon, authenticated/i);
  assert.match(migration, /grant all on table public\.website_checkout_intents to service_role/i);
  assert.match(migration, /status in \('pending_auth', 'ready', 'checkout_started'\)/i);
});
