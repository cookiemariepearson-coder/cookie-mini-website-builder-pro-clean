import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('checkout return is bound to the exact HttpOnly intent and website UUID', async () => {
  const [continuation, verification] = await Promise.all([
    source('app/api/checkout/intent/continue/route.js'),
    source('app/api/checkout/verify/route.js')
  ]);
  assert.match(continuation, /cookieWebsiteCheckoutReturn/);
  assert.match(continuation, /httpOnly: true/);
  assert.match(continuation, /sameSite: 'lax'/);
  assert.match(verification, /cookieWebsiteCheckoutReturn/);
  assert.match(verification, /intent\.website_id/);
  assert.match(verification, /checkoutIntentIdentityBelongsToOwner\(intent, owner\)/);
  assert.match(verification, /returnPath: `\/builder\?website=/);
  assert.match(verification, /\.eq\('id', intent\.website_id\)/);
});

test('Gumroad handoff pre-fills immutable website and checkout references', async () => {
  const redirect = await source('lib/checkoutRedirect.js');
  assert.match(redirect, /Website name or subdomain/);
  assert.match(redirect, /Checkout reference/);
  assert.match(redirect, /intent\.status !== 'checkout_started'/);
  assert.match(redirect, /website\.slug !== intent\.draft_slug/);
});

test('paid return never auto-publishes and returns to the verified saved website', async () => {
  const success = await source('app/checkout/success/page.js');
  const paidBranch = success.slice(success.indexOf("if (['starter', 'business', 'premium', 'extra']"), success.indexOf('const raw = localStorage'));
  assert.match(paidBranch, /fetch\('\/api\/checkout\/verify'/);
  assert.match(paidBranch, /window\.location\.replace\(verification\.returnPath\)/);
  assert.doesNotMatch(paidBranch, /\/api\/site\/publish/);
});

test('duplicate provider callbacks remain idempotent before entitlement updates', async () => {
  const service = await source('lib/gumroadSubscriptionService.mjs');
  assert.match(service, /error\.code !== '23505'/);
  assert.match(service, /prior\.processing_status !== 'failed'/);
  assert.match(service, /claimed: false, duplicate: true/);
  assert.match(service, /applyWithCompareAndSet/);
});

test('failed, ended, disputed or invalid product evidence cannot authorize publication', async () => {
  const [lifecycle, publish] = await Promise.all([
    source('lib/subscriptionLifecycle.mjs'),
    source('app/api/site/publish/route.js')
  ]);
  assert.match(lifecycle, /payment_failed/);
  assert.match(lifecycle, /dispute_review/);
  assert.match(lifecycle, /product_mismatch/);
  assert.match(publish, /publishPlanDecision/);
});
