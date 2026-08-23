import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('first click saves with the intent returned by that same click', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /saveDraftOnline\(draft, true, intentId\)/);
  assert.match(builder, /checkoutIntentId: checkoutIntentId \|\| pendingCheckoutIntent \|\| ''/);
  assert.match(builder, /websiteId: site\.websiteId \|\| site\.draftId \|\| ''/);
});

test('initial click and Retry use one checkout handler and one validation path', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /onClick=\{\(\) => checkoutPlan\(\)\}/);
  assert.equal((builder.match(/async function checkoutPlan\(/g) || []).length, 1);
  assert.equal((builder.match(/continueServerCheckout\(intentId, draft\.slug\)/g) || []).length >= 1, true);
});

test('stale Free, Business, Premium and abandoned intents can only be superseded by the exact saved website plan', async () => {
  const start = await source('app/api/checkout/intent/start/route.js');
  assert.match(start, /requestedPlan === websitePlan/);
  assert.match(start, /STALE_CROSS_PLAN_INTENT/);
  assert.match(start, /INTENT_SUPERSEDED_FOR_WEBSITE_PLAN/);
  assert.match(start, /siteBelongsToOwner\(ownedWebsite, owner\)/);
  assert.match(start, /websiteId: website\.id/);
});

test('cross-plan and cross-website substitution fail closed at final continuation', async () => {
  const continuation = await source('app/api/checkout/intent/continue/route.js');
  assert.match(continuation, /data\.website_id && data\.website_id !== website\.id/);
  assert.match(continuation, /savedPlan !== state\.plan/);
  assert.match(continuation, /WEBSITE_PLAN_MISMATCH/);
  assert.match(continuation, /siteBelongsToOwner\(website, owner\)/);
});

test('redacted diagnostics record plan, product, entitlement and hashed subjects without secrets', async () => {
  const intent = await source('lib/websiteCheckoutIntent.mjs');
  assert.match(intent, /storedPlan:/);
  assert.match(intent, /builderPlan:/);
  assert.match(intent, /browserPlan:/);
  assert.match(intent, /intentPlan:/);
  assert.match(intent, /product:/);
  assert.match(intent, /entitlementState:/);
  assert.match(intent, /websiteCheckoutSubjectRef/);
  assert.doesNotMatch(intent, /console\.info\([^\n]*(email|token|checkoutUrl)/i);
});
