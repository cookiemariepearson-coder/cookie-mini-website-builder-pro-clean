import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getDfyCheckoutConfiguration, resolveDfyCheckout } from '../lib/dfyCommerce.mjs';

const distinctDfy = {
  DFY_FREE_LAUNCH_CHECKOUT_URL: 'https://cookiepearson.gumroad.com/l/dfy-free',
  DFY_STARTER_CHECKOUT_URL: 'https://cookiepearson.gumroad.com/l/dfy-starter',
  DFY_BUSINESS_CHECKOUT_URL: 'https://cookiepearson.gumroad.com/l/dfy-business',
  DFY_PREMIUM_CHECKOUT_URL: 'https://cookiepearson.gumroad.com/l/dfy-premium',
  DFY_EXTRA_PAGE_CHECKOUT_URL: 'https://cookiepearson.gumroad.com/l/dfy-extra'
};

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('all five DFY services require distinct HTTPS Gumroad destinations', () => {
  const configuration = getDfyCheckoutConfiguration(distinctDfy);
  assert.equal(configuration.length, 5);
  assert.equal(configuration.every((item) => item.configured), true);
  assert.deepEqual(configuration.map((item) => item.setupPrice), [
    '$99 one-time setup',
    '$249 one-time setup',
    '$499 one-time setup',
    '$899 one-time setup',
    '$125 one-time setup'
  ]);
});

test('a missing DFY setting remains unavailable without a fallback', () => {
  const result = resolveDfyCheckout('Business', distinctDfy);
  const missing = resolveDfyCheckout('Business', { ...distinctDfy, DFY_BUSINESS_CHECKOUT_URL: '' });
  assert.equal(result.configured, true);
  assert.equal(missing.configured, false);
  assert.equal(missing.url, '');
  assert.equal(missing.reason, 'missing');
});

test('non-Gumroad and non-HTTPS DFY destinations are rejected', () => {
  for (const value of ['https://example.com/business', 'http://cookiepearson.gumroad.com/l/business', 'javascript:alert(1)']) {
    const result = resolveDfyCheckout('Business', { ...distinctDfy, DFY_BUSINESS_CHECKOUT_URL: value });
    assert.equal(result.configured, false);
    assert.equal(result.url, '');
    assert.equal(result.reason, 'invalid-gumroad-url');
  }
});

test('Business and Premium DFY cannot reuse their monthly subscription products', () => {
  const businessSubscription = 'https://cookiepearson.gumroad.com/l/business-monthly';
  const premiumSubscription = 'https://cookiepearson.gumroad.com/l/premium-monthly';
  const environment = {
    ...distinctDfy,
    DFY_BUSINESS_CHECKOUT_URL: businessSubscription,
    DFY_PREMIUM_CHECKOUT_URL: premiumSubscription,
    NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL: businessSubscription,
    NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL: premiumSubscription
  };
  assert.equal(resolveDfyCheckout('Business', environment).reason, 'subscription-or-ai-video-conflict');
  assert.equal(resolveDfyCheckout('Premium', environment).reason, 'subscription-or-ai-video-conflict');
});

test('checkout query parameters cannot disguise reuse of a protected product', () => {
  const monthly = 'https://cookiepearson.gumroad.com/l/business-monthly';
  const result = resolveDfyCheckout('Business', {
    ...distinctDfy,
    DFY_BUSINESS_CHECKOUT_URL: `${monthly}?wanted=true&utm_source=builder`,
    NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL: monthly
  });
  assert.equal(result.reason, 'subscription-or-ai-video-conflict');
  assert.equal(result.url, '');
});

test('a DFY service cannot reuse Free, Starter, AI Video, or another DFY product', () => {
  const duplicateFree = resolveDfyCheckout('Business', {
    ...distinctDfy,
    DFY_BUSINESS_CHECKOUT_URL: distinctDfy.DFY_FREE_LAUNCH_CHECKOUT_URL
  });
  assert.equal(duplicateFree.reason, 'duplicate-dfy-product');
  assert.equal(duplicateFree.conflictsWith, 'Free Launch Page');

  const aiUrl = 'https://cookiepearson.gumroad.com/l/aivideostudio';
  const aiConflict = resolveDfyCheckout('Extra Page Add-On', {
    ...distinctDfy,
    DFY_EXTRA_PAGE_CHECKOUT_URL: aiUrl,
    NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL: aiUrl
  });
  assert.equal(aiConflict.reason, 'subscription-or-ai-video-conflict');
});

test('customer emails receive only the resolved checkout for their selected request', async () => {
  const route = await source('app/api/done-for-you/request/route.js');
  assert.match(route, /resolveDfyCheckout\(plan, process\.env\)/);
  assert.match(route, /const checkoutBlock = checkoutUrl/);
  assert.match(route, /Continue to secure checkout/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL|NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL|NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL/);
});

test('missing checkout requests stay stored and notify the owner about manual assistance', async () => {
  const route = await source('app/api/done-for-you/request/route.js');
  assert.match(route, /This customer needs manual checkout assistance/);
  assert.match(route, /Do not substitute a monthly website subscription or another product/);
  assert.match(route, /Your request is safely received\. Secure checkout is temporarily unavailable/);
  assert.match(route, /createCustomerRequest/);
});

test('selecting an emailed checkout link does not create a second customer request', async () => {
  const route = await source('app/api/done-for-you/request/route.js');
  const requestCreation = (route.match(/createCustomerRequest\(/g) || []).length;
  assert.equal(requestCreation, 1);
  assert.match(route, /<a href="\$\{escapeHtml\(checkoutUrl\)\}"/);
  assert.doesNotMatch(route, /href="\/api\/done-for-you\/request/);
});
