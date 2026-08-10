import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  builderCheckoutConfirmationUrl,
  canonicalBuilderOrigin,
  normalizeBuilderCheckoutAuthToken,
  normalizeBuilderCheckoutAuthType
} from '../lib/builderCheckoutAuth.mjs';

const INTENT_ID = '11111111-1111-4111-8111-111111111111';
const TOKEN_HASH = 'token_hash_value_1234567890-ABCDEFG';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Builder checkout auth always uses the canonical Builder origin', () => {
  assert.equal(canonicalBuilderOrigin('https://cookiesdigitalcreations.com/api/auth', 'cookiesdigitalcreations.com'), 'https://www.cookiesdigitalcreations.com');
  assert.equal(canonicalBuilderOrigin('https://www.cookiesdigitalcreations.com/api/auth', 'cookiesdigitalcreations.com'), 'https://www.cookiesdigitalcreations.com');
  assert.equal(canonicalBuilderOrigin('https://preview.example/api/auth', 'cookiesdigitalcreations.com'), 'https://preview.example');
});

test('Builder checkout email link keeps its opaque intent in the query and secret token in the fragment', () => {
  const link = builderCheckoutConfirmationUrl({
    origin: 'https://www.cookiesdigitalcreations.com',
    intentId: INTENT_ID,
    tokenHash: TOKEN_HASH,
    type: 'magiclink'
  });
  assert.equal(link, `https://www.cookiesdigitalcreations.com/customer/auth/confirm?intent=${INTENT_ID}#token_hash=${TOKEN_HASH}&type=magiclink`);
  assert.doesNotMatch(link, /connect\.cookiesdigitalcreations\.com/);
  assert.doesNotMatch(link.split('#')[0], /token_hash/);
});

test('invalid intent, token, and verification types cannot construct a checkout authentication link', () => {
  assert.equal(builderCheckoutConfirmationUrl({ origin: 'https://www.cookiesdigitalcreations.com', intentId: 'wrong', tokenHash: TOKEN_HASH, type: 'magiclink' }), '');
  assert.equal(normalizeBuilderCheckoutAuthToken('short'), '');
  assert.equal(normalizeBuilderCheckoutAuthType('signup'), '');
  assert.equal(normalizeBuilderCheckoutAuthType('magiclink'), 'magiclink');
});

test('paid checkout email is generated server-side and sent with the existing verified sender', async () => {
  const request = await source('app/api/auth/site-owner/request/route.js');
  assert.match(request, /auth\.admin\.generateLink\(\{/);
  assert.match(request, /type: 'magiclink'/);
  assert.match(request, /builderCheckoutConfirmationUrl/);
  assert.match(request, /sendResendEmail\(\{/);
  assert.match(request, /process\.env\.ADMIN_NOTIFICATION_FROM_EMAIL/);
  assert.match(request, /Verify Email and Continue Checkout/);
  assert.doesNotMatch(request, /connect\.cookiesdigitalcreations\.com/);
});

test('Builder-owned confirmation validates token and server intent email binding before returning a session', async () => {
  const confirm = await source('app/api/auth/site-owner/confirm/route.js');
  assert.match(confirm, /website_checkout_intents/);
  assert.match(confirm, /websiteCheckoutIntentState/);
  assert.match(confirm, /state\.emailHash/);
  assert.match(confirm, /auth\.verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
  assert.match(confirm, /verifiedEmailHash !== state\.emailHash/);
  assert.match(confirm, /Cache-Control': 'no-store/);
  assert.doesNotMatch(confirm, /console\.(log|info|error)\([^\n]*(tokenHash|accessToken)/);
});

test('cross-browser confirmation removes the token fragment and resumes only the matching server intent', async () => {
  const page = await source('app/customer/auth/confirm/page.js');
  assert.match(page, /window\.history\.replaceState/);
  assert.match(page, /fetch\('\/api\/auth\/site-owner\/confirm'/);
  assert.match(page, /body: JSON\.stringify\(\{ intentId, tokenHash, type \}\)/);
  assert.match(page, /fetch\('\/api\/checkout\/intent\/resume'/);
  assert.match(page, /window\.location\.replace\(resumed\.builderPath\)/);
  assert.match(page, /Continue Secure Checkout/);
  assert.match(page, /Return to Builder/);
});

test('generic My Website authentication remains isolated from the paid Builder callback', async () => {
  const request = await source('app/api/auth/site-owner/request/route.js');
  assert.match(request, /else \{\s+const redirectTo = `\$\{origin\}\/customer\/auth\/callback/);
  assert.match(request, /supabase\.auth\.signInWithOtp/);
});

test('Premium checkout gives immediate visible progress, blocks duplicate clicks, and offers retry', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /const checkoutBusyRef = useRef\(false\)/);
  assert.match(builder, /if \(checkoutBusyRef\.current\) return/);
  assert.match(builder, /disabled=\{Boolean\(checkoutBusyPlan\)\}/);
  assert.match(builder, /aria-busy=\{checkoutBusyPlan === site\.plan\}/);
  assert.match(builder, /Opening Secure \$\{plans\[site\.plan\]\?\.price\} Checkout/);
  assert.match(builder, /Retry Secure \$\{plans\[site\.plan\]\?\.price\} Checkout/);
});

test('changing paid plans cannot silently reuse an intent for another product', async () => {
  const [builder, start] = await Promise.all([
    source('app/builder/page.js'),
    source('app/api/checkout/intent/start/route.js')
  ]);
  assert.match(builder, /setPendingCheckoutIntent\(''\)/);
  assert.match(builder, /setResumeCheckoutRequested\(false\)/);
  assert.match(start, /requestedPlan !== state\.plan/);
});

test('Business and Premium remain bound to their exact centralized checkout routes', async () => {
  const [commerce, pricing] = await Promise.all([
    source('lib/commerceConfig.mjs'),
    source('app/pricing/page.js')
  ]);
  assert.match(commerce, /business: Object\.freeze\(\{ route: '\/checkout\/business'/);
  assert.match(commerce, /premium: Object\.freeze\(\{ route: '\/checkout\/premium'/);
  assert.match(pricing, /href: '\/builder\?checkout=business'/);
  assert.match(pricing, /href: '\/builder\?checkout=premium'/);
});
