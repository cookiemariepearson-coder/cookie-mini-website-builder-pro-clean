import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AI_VIDEO_CHECKOUT,
  DFY_CHECKOUT_ENV_BY_SERVICE,
  WEBSITE_CHECKOUTS,
  builderCheckoutReturnPath,
  cleanCheckoutUrl,
  createPendingCheckoutIntent,
  customerReturnPath,
  parsePendingCheckoutIntent,
  pendingCheckoutReturnPath,
  resolveCustomerContinuation,
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
  assert.deepEqual(DFY_CHECKOUT_ENV_BY_SERVICE, {
    'Free Launch Page': 'DFY_FREE_LAUNCH_CHECKOUT_URL',
    'Starter Pro': 'DFY_STARTER_CHECKOUT_URL',
    Business: 'DFY_BUSINESS_CHECKOUT_URL',
    Premium: 'DFY_PREMIUM_CHECKOUT_URL',
    'Extra Page Add-On': 'DFY_EXTRA_PAGE_CHECKOUT_URL'
  });
});

test('checkout URLs are normalized safely and dangerous destinations are rejected', () => {
  assert.equal(cleanCheckoutUrl('cookiepearson.gumroad.com/l/starter'), 'https://cookiepearson.gumroad.com/l/starter');
  assert.equal(cleanCheckoutUrl('https://cookiepearson.gumroad.com/l/aivideostudio'), 'https://cookiepearson.gumroad.com/l/aivideostudio');
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
  assert.equal(customerReturnPath('builder', 'starter'), '/builder?checkout=starter');
  assert.equal(customerReturnPath('video-studio'), '/video-studio');
  assert.equal(safeCustomerReturnPath('/video-studio'), '/video-studio');
});

test('real paid-plan browser sequence survives a callback that loses its return query', () => {
  const now = Date.parse('2026-08-08T16:00:00Z');
  const selected = createPendingCheckoutIntent('business', 'cookies-kitchen', now);
  const browserStorage = JSON.stringify(selected);

  assert.deepEqual(parsePendingCheckoutIntent(browserStorage, now + 60_000), selected);
  assert.equal(customerReturnPath('builder', 'business', 'cookies-kitchen'), '/builder?checkout=business&draft=cookies-kitchen');
  assert.equal(resolveCustomerContinuation('', browserStorage, now + 60_000), '/builder?checkout=business&draft=cookies-kitchen');
  assert.equal(resolveCustomerContinuation('/customer', browserStorage, now + 60_000), '/builder?checkout=business&draft=cookies-kitchen');
  assert.equal(pendingCheckoutReturnPath(browserStorage, now + (3 * 60 * 60 * 1000)), '/customer');
  assert.equal(resolveCustomerContinuation('https://attacker.example', browserStorage, now + 60_000), '/builder?checkout=business&draft=cookies-kitchen');
});

test('valid restored customer sessions continue instead of terminating at the dashboard', async () => {
  const [customer, authRequest, callback] = await Promise.all([
    source('app/customer/page.js'),
    source('app/api/auth/site-owner/request/route.js'),
    source('app/customer/auth/callback/page.js')
  ]);
  assert.match(customer, /window\.location\.replace\(requestedReturnPath\)/);
  assert.match(customer, /PENDING_CHECKOUT_STORAGE_KEY/);
  assert.match(customer, /pendingCheckoutReturnPath/);
  assert.match(customer, /params\.get\('draft'\)/);
  assert.match(authRequest, /safeCustomerReturnPath\(body\.returnPath\)/);
  assert.match(callback, /resolveCustomerContinuation/);
  assert.match(callback, /PENDING_CHECKOUT_STORAGE_KEY/);
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
  assert.match(api, /createCustomerRequest/);
  assert.match(api, /notificationsAccepted/);
});

test('DFY and Contact independently record provider acceptance and request storage', async () => {
  const [dfy, contact, email, migration] = await Promise.all([
    source('app/api/done-for-you/request/route.js'),
    source('app/api/contact/route.js'),
    source('lib/resendEmail.mjs'),
    source('supabase/customer_requests_migration.sql')
  ]);
  assert.match(dfy, /dfy-admin/);
  assert.match(dfy, /dfy-customer/);
  assert.match(contact, /contact-admin/);
  assert.match(email, /email_provider_accepted/);
  assert.match(email, /email_provider_rejected/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.customer_requests from anon, authenticated/i);
});

test('website and standalone video access remain server verified', async () => {
  const [checkoutVerify, videoAccess, videoLicense, videoCreate, studio, videoCheckout, homepage, checkoutSuccess] = await Promise.all([
    source('app/api/checkout/verify/route.js'),
    source('app/api/video-access/activate/route.js'),
    source('lib/gumroadVideoLicense.mjs'),
    source('app/api/heygen/create/route.js'),
    source('app/video-studio/page.js'),
    source('app/checkout/ai-video/page.js'),
    source('app/page.js'),
    source('app/checkout/success/page.js')
  ]);
  assert.match(checkoutVerify, /getVerifiedSiteOwner/);
  assert.match(checkoutVerify, /siteBelongsToOwner/);
  assert.match(videoLicense, /api\.gumroad\.com\/v2\/licenses\/verify/);
  assert.match(videoLicense, /increment_uses_count: 'false'/);
  assert.match(videoAccess, /process\.env\.GUMROAD_AI_VIDEO_PRODUCT_ID/);
  assert.match(videoAccess, /emailHash: videoEmailHash\(purchaseEmail\)/);
  assert.doesNotMatch(videoAccess, /saleId\s*:/);
  assert.match(videoAccess, /createVideoAccessToken/);
  assert.match(videoCreate, /verifyVideoAccessToken/);
  assert.match(videoCreate, /async function incrementUsage/);
  assert.match(videoCreate, /video_usage_month/);
  const accessPanel = studio.slice(studio.indexOf('<div className="notice videoAccessPanel">'), studio.indexOf('<div className="studioSteps"'));
  assert.match(accessPanel, /data-testid="video-top-purchase"><Link className="btn dark" href="\/checkout\/ai-video">Purchase Now/);
  assert.doesNotMatch(accessPanel, /View Video Results/);
  assert.match(studio, /href="\/customer\?return=video-studio">Secure Website-Plan Sign-In/);
  assert.match(studio, /Verify License/);
  assert.equal((studio.match(/data-testid="video-generation-actions"/g) || []).length, 2);
  assert.equal((studio.match(/href="\/video-studio\/results">View Video Results/g) || []).length, 2);
  assert.doesNotMatch(studio, /if \(!accessToken\) \{\s*setStatus\('Unlock AI Video Studio before creating the AI-powered Smart Video Kit/);
  assert.match(studio, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(studio, /localStorage\.setItem\(VIDEO_PLAN_KEY/);
  assert.match(studio, /localStorage\.getItem\(VIDEO_PLAN_KEY/);
  assert.match(studio, /if \(!planStorageReady\) return/);
  assert.match(studio, /get\('activate'\) === '1'/);
  const videoKit = await source('app/api/video-kit/route.js');
  assert.doesNotMatch(videoKit, /if \(!access\) return NextResponse/);
  assert.match(videoCreate, /const access = await checkCustomerAccess\(request, body\)/);
  assert.ok(videoCreate.indexOf('const access = await checkCustomerAccess(request, body)') < videoCreate.indexOf("fetch('https://api.heygen.com/v3/video-agents'"));
  assert.match(videoCreate, /status: 'submitting'/);
  assert.match(videoCreate, /request_key/);
  assert.match(videoCreate, /generationNotStarted: true/);
  assert.ok(videoCreate.indexOf("status: 'submitting'") < videoCreate.indexOf("fetch('https://api.heygen.com/v3/video-agents'"));
  assert.match(videoCheckout, /NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL/);
  assert.match(videoCheckout, /href=\{checkoutUrl\}/);
  assert.doesNotMatch(videoCheckout, /new URLSearchParams|localStorage|getSupabaseAdmin/);
  assert.match(videoCheckout, /Continue to Secure Gumroad Checkout — \$5/);
  assert.match(videoCheckout, /href="\/video-studio\?activate=1">\s*Return to AI Video Studio &amp; Verify License/);
  assert.match(videoCheckout, /If Gumroad cannot complete your payment, review your billing country and postal code, turn off any VPN/);
  assert.match(videoCheckout, /href="\/video-studio">Resume Saved Plan/);
  assert.match(videoCheckout, /mailto:support@gumroad.com\?subject=AI%20Video%20checkout%20payment%20help/);
  assert.match(videoCheckout, /mailto:hello@cookiesdigitalcreations.com\?subject=AI%20Video%20product%20or%20Builder%20help/);
  assert.doesNotMatch(videoCheckout, /target="_blank"/);
  assert.match(homepage, /href="\/checkout\/ai-video">Start AI Video Studio/);
  assert.match(checkoutSuccess, /href="\/video-studio\?activate=1">Open AI Video Studio &amp; Verify License/);
});
