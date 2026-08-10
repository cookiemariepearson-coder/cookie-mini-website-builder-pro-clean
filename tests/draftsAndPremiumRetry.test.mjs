import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  checkoutIntentIdentityBelongsToOwner,
  newWebsiteCheckoutIntent,
  websiteCheckoutIntentState
} from '../lib/websiteCheckoutIntent.mjs';

const NOW = Date.parse('2036-08-10T12:00:00Z');
const ID = '11111111-1111-4111-8111-111111111111';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function premiumIntent(patch = {}) {
  return {
    ...newWebsiteCheckoutIntent({ id: ID, plan: 'premium', draftSlug: 'cookies-kitchen', email: 'owner@example.com', ownerId: 'owner-a', now: NOW }),
    ...patch
  };
}

test('verified Premium intent remains resumable for its matching owner', () => {
  const row = premiumIntent();
  assert.equal(websiteCheckoutIntentState(row, NOW + 60_000).status, 'ready');
  assert.equal(checkoutIntentIdentityBelongsToOwner(row, { id: 'owner-a', email: 'owner@example.com' }), true);
});

test('expired Premium identity can be checked without weakening owner isolation', () => {
  const row = premiumIntent({ expires_at: new Date(NOW - 1).toISOString() });
  assert.equal(websiteCheckoutIntentState(row, NOW).reason, 'expired');
  assert.equal(checkoutIntentIdentityBelongsToOwner(row, { id: 'owner-a', email: 'owner@example.com' }), true);
  assert.equal(checkoutIntentIdentityBelongsToOwner(row, { id: 'owner-b', email: 'other@example.com' }), false);
});

test('Premium Retry reuses a valid verified intent and replaces only an expired owned intent', async () => {
  const [start, builder] = await Promise.all([
    source('app/api/checkout/intent/start/route.js'),
    source('app/builder/page.js')
  ]);
  assert.match(start, /VERIFIED_INTENT_REUSED/);
  assert.match(start, /INTENT_REPLACED_AFTER_EXPIRY/);
  assert.match(start, /checkoutIntentBelongsToOwner/);
  assert.match(start, /checkoutIntentIdentityBelongsToOwner/);
  assert.match(start, /state\.reason !== 'expired'/);
  assert.match(start, /state\.reason === 'used'/);
  assert.match(builder, /headers: ownerAuthHeaders\(\)/);
  assert.match(builder, /if \(data\.replaced\)/);
});

test('Premium Retry keeps the server plan and draft authoritative', async () => {
  const start = await source('app/api/checkout/intent/start/route.js');
  assert.match(start, /requestedPlan !== storedPlan/);
  assert.match(start, /identityBound && storedDraftSlug && storedDraftSlug !== draftSlug/);
  assert.match(start, /siteBelongsToOwner/);
  assert.match(start, /replacementDraftSlug = identityBound \? storedDraftSlug : draftSlug/);
});

test('fresh Pricing intent may bind its placeholder draft to the current browser draft exactly once', async () => {
  const start = await source('app/api/checkout/intent/start/route.js');
  assert.match(start, /const identityBound = Boolean\(existing\?\.owner_id \|\| existing\?\.email_hash\)/);
  assert.match(start, /if \(identityBound && storedDraftSlug && storedDraftSlug !== draftSlug\)/);
  assert.match(start, /\.update\(\{ draft_slug: draftSlug \}\)/);
  assert.match(start, /\.is\('owner_id', null\)/);
  assert.match(start, /\.is\('email_hash', null\)/);
});

test('signed-out Open My Drafts requests a Builder-owned secure sign-in', async () => {
  const [customer, request, confirm] = await Promise.all([
    source('app/customer/page.js'),
    source('app/api/auth/site-owner/request/route.js'),
    source('app/customer/auth/confirm/page.js')
  ]);
  assert.match(customer, /Email My Secure Sign-In Link/);
  assert.match(request, /builderCustomerConfirmationUrl/);
  assert.match(request, /Open your Cookie Mini Website Builder drafts/);
  assert.doesNotMatch(request, /signInWithOtp/);
  assert.match(confirm, /Open My Drafts Securely/);
  assert.match(confirm, /window\.location\.replace\(confirmation\.returnPath === '\/customer' \? '\/customer\?verified=1'/);
});

test('verified owner automatically loads saved drafts without a second search click', async () => {
  const customer = await source('app/customer/page.js');
  assert.match(customer, /autoLoadedOwnerRef/);
  assert.match(customer, /findSites\(true\)/);
  assert.match(customer, /Loading your websites and drafts/);
});

test('draft enumeration is scoped by owner id with a legacy unowned-email fallback only', async () => {
  const search = await source('app/api/site/search/route.js');
  assert.match(search, /\.eq\('owner_id', owner\.user\.id\)/);
  assert.match(search, /\.is\('owner_id', null\)\.eq\('customer_email', email\)/);
  assert.equal((search.match(/\.eq\('customer_email', email\)/g) || []).length, 2);
  assert.equal((search.match(/\.is\('owner_id', null\)/g) || []).length, 2);
});

test('another customer cannot open, alter, publish, or purchase for an owned draft', async () => {
  const routes = await Promise.all([
    'app/api/site/get/route.js',
    'app/api/site/draft/route.js',
    'app/api/site/save/route.js',
    'app/api/site/publish/route.js',
    'app/api/checkout/intent/continue/route.js'
  ].map(source));
  for (const route of routes) {
    assert.match(route, /getVerifiedSiteOwner/);
    assert.match(route, /siteBelongsToOwner/);
  }
});

test('Retry remains visibly progressive and cannot double-submit', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /checkoutBusyRef\.current = true/);
  assert.match(builder, /Opening your secure/);
  assert.match(builder, /disabled=\{Boolean\(checkoutBusyPlan\)\}/);
  assert.match(builder, /Retry Secure \$\{plans\[site\.plan\]\?\.price\} Checkout/);
});
