import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AI_VIDEO_CHECKOUT,
  DFY_CHECKOUT_ENV_BY_SERVICE,
  WEBSITE_CHECKOUTS,
  builderCheckoutReturnPath,
  cleanCheckoutUrl,
  safeCustomerReturnPath,
  websiteCheckoutRoute
} from '../lib/commerceConfig.mjs';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('central commerce configuration maps every approved customer checkout path', () => {
  assert.deepEqual(Object.keys(WEBSITE_CHECKOUTS), ['starter', 'business', 'premium', 'extra']);
  assert.equal(websiteCheckoutRoute('starter'), '/checkout/starter');
  assert.equal(websiteCheckoutRoute('business'), '/checkout/business');
  assert.equal(websiteCheckoutRoute('premium'), '/checkout/premium');
  assert.equal(websiteCheckoutRoute('extra'), '/checkout/extra');
  assert.equal(websiteCheckoutRoute('forged-plan'), '');
  assert.equal(AI_VIDEO_CHECKOUT.route, '/checkout/ai-video');
  assert.equal(Object.keys(DFY_CHECKOUT_ENV_BY_SERVICE).length, 5);
});

test('checkout URLs are normalized safely and dangerous destinations are rejected', () => {
  assert.equal(cleanCheckoutUrl('cookiepearson.gumroad.com/l/starter'), 'https://cookiepearson.gumroad.com/l/starter');
  assert.equal(cleanCheckoutUrl('javascript:alert(1)'), '');
  assert.equal(cleanCheckoutUrl('data:text/html,unsafe'), '');
});

test('selected paid plan survives email verification without allowing an open redirect', () => {
  for (const plan of Object.keys(WEBSITE_CHECKOUTS)) {
    const path = builderCheckoutReturnPath(plan);
    assert.equal(path, `/builder?checkout=${plan}`);
    assert.equal(safeCustomerReturnPath(path), path);
  }
  assert.equal(safeCustomerReturnPath('https://attacker.example/checkout'), '/customer');
  assert.equal(safeCustomerReturnPath('/builder?checkout=forged'), '/customer');
});

test('Contact Us is publicly reachable from persistent navigation and homepage footer', async () => {
  const [nav, footer, contact] = await Promise.all([
    source('lib/Nav.jsx'),
    source('lib/OwnerFooter.jsx'),
    source('app/contact/page.js')
  ]);
  assert.match(nav, /href="\/contact">Contact Us/);
  assert.match(footer, /href="\/contact">Contact Us/);
  assert.match(contact, /fetch\('\/api\/contact'/);
});

test('Done-for-You keeps the request path alive when checkout is not configured', async () => {
  const [api, page] = await Promise.all([
    source('app/api/done-for-you/request/route.js'),
    source('app/done-for-you/request/page.js')
  ]);
  assert.match(api, /Your request is safely received\. Secure checkout is temporarily unavailable/);
  assert.match(api, /checkoutConfigured: Boolean\(checkoutUrl\)/);
  assert.doesNotMatch(api, /Your request was not submitted or charged/);
  assert.match(page, /Cookie Digital Creations will contact you with the correct payment step/);
});

test('website and standalone video access remain server verified', async () => {
  const [checkoutVerify, videoAccess, videoCreate, studio] = await Promise.all([
    source('app/api/checkout/verify/route.js'),
    source('app/api/video-access/activate/route.js'),
    source('app/api/heygen/create/route.js'),
    source('app/video-studio/page.js')
  ]);
  assert.match(checkoutVerify, /getVerifiedSiteOwner/);
  assert.match(checkoutVerify, /siteBelongsToOwner/);
  assert.match(videoAccess, /api\.gumroad\.com\/v2\/licenses\/verify/);
  assert.match(videoAccess, /createVideoAccessToken/);
  assert.match(videoCreate, /verifyVideoAccessToken/);
  assert.match(videoCreate, /async function incrementUsage/);
  assert.match(videoCreate, /video_usage_month/);
  assert.match(studio, /href="\/checkout\/ai-video">Buy \$5 Standalone AI Video Access/);
});
