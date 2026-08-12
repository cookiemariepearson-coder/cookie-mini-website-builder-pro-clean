import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  APPROVED_WEBSITE_PRODUCTS,
  identifyWebsiteProduct,
  sanitizeGumroadPayload
} from '../lib/gumroadWebsiteProducts.mjs';
import {
  checkoutIntentBuilderPath,
  checkoutIntentEmailHash,
  newWebsiteCheckoutIntent,
  websiteCheckoutIntentState
} from '../lib/websiteCheckoutIntent.mjs';
import { normalizeSelectedPagesForPlan, planSectionLimit } from '../lib/siteDefaults.js';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('each live website product is bound to one approved plan identity', () => {
  for (const [key, product] of Object.entries(APPROVED_WEBSITE_PRODUCTS)) {
    const payload = {
      product_id: product.productId,
      product_permalink: `https://cookiepearson.gumroad.com/l/${product.permalink}`,
      short_product_id: product.shortProductId || ''
    };
    assert.equal(identifyWebsiteProduct(payload)?.key, key);
  }
});

test('standalone AI Video and mismatched website identifiers cannot activate a website plan', () => {
  assert.equal(identifyWebsiteProduct({
    product_id: 'GE_fDgvz_GT29Fn6eSj9uw==',
    product_permalink: 'https://cookiepearson.gumroad.com/l/aivideostudio',
    product_name: "Cookie's AI Video Studio"
  }), null);
  assert.equal(identifyWebsiteProduct({
    product_id: APPROVED_WEBSITE_PRODUCTS.starter.productId,
    product_permalink: `https://cookiepearson.gumroad.com/l/${APPROVED_WEBSITE_PRODUCTS.business.permalink}`
  }), null);
  assert.equal(identifyWebsiteProduct({ product_name: APPROVED_WEBSITE_PRODUCTS.premium.name }), null);
});

test('stored webhook evidence excludes license, payment-card, email and personal fields', () => {
  const safe = sanitizeGumroadPayload({
    product_id: 'approved',
    sale_id: 'sale',
    email: 'customer@example.com',
    full_name: 'Customer Name',
    license_key: 'private-license',
    'card[bin]': '123456',
    'card[expiry_month]': '12',
    'custom_fields[Website name or subdomain]': 'customer-site'
  });
  assert.equal(safe.product_id, 'approved');
  assert.equal(safe.sale_id, 'sale');
  assert.equal(safe['custom_fields[Website name or subdomain]'], 'customer-site');
  assert.equal('email' in safe, false);
  assert.equal('full_name' in safe, false);
  assert.equal('license_key' in safe, false);
  assert.equal('card[bin]' in safe, false);
});

test('server checkout intent survives a different browser without exposing the email', () => {
  const now = Date.parse('2036-08-10T12:00:00Z');
  const record = newWebsiteCheckoutIntent({ id: '11111111-1111-4111-8111-111111111111', plan: 'business', draftSlug: 'cookies-kitchen', email: 'Customer@Example.com', now });
  assert.equal(record.email_hash, checkoutIntentEmailHash('customer@example.com'));
  assert.doesNotMatch(JSON.stringify(record), /customer@example\.com/i);
  assert.equal(checkoutIntentBuilderPath(record), '/builder?checkoutIntent=11111111-1111-4111-8111-111111111111&draft=cookies-kitchen');
  assert.equal(websiteCheckoutIntentState(record, now + (3 * 60 * 60 * 1000)).reason, 'expired');
});

test('pricing starts paid website plans in the builder before Gumroad', async () => {
  const [pricing, checkoutHome] = await Promise.all([
    source('app/pricing/page.js'),
    source('app/checkout/page.js')
  ]);
  assert.match(pricing, /href: '\/builder\?checkout=starter'/);
  assert.match(pricing, /href: '\/builder\?checkout=business'/);
  assert.match(pricing, /href: '\/builder\?checkout=premium'/);
  assert.doesNotMatch(pricing, /href: '\/checkout\/(starter|business|premium)'/);
  assert.match(pricing, /Open My Website for Add-On/);
  assert.doesNotMatch(checkoutHome, /href="\/checkout\/(starter|business|premium|extra)"/);
  assert.match(checkoutHome, /href="\/builder\?checkout=business"/);
});

test('auth callback, dashboard fallback and restored sessions recover server-side checkout intent', async () => {
  const [request, confirm, callback, customer, resume, active] = await Promise.all([
    source('app/api/auth/site-owner/request/route.js'),
    source('app/customer/auth/confirm/page.js'),
    source('app/customer/auth/callback/page.js'),
    source('app/customer/page.js'),
    source('app/api/checkout/intent/resume/route.js'),
    source('app/api/checkout/intent/active/route.js')
  ]);
  assert.match(request, /website_checkout_intents/);
  assert.match(request, /builderCheckoutConfirmationUrl/);
  assert.match(confirm, /\/api\/auth\/site-owner\/confirm/);
  assert.match(confirm, /\/api\/checkout\/intent\/resume/);
  assert.match(callback, /\/api\/checkout\/intent\/resume/);
  assert.match(customer, /\/api\/checkout\/intent\/active/);
  assert.match(customer, /Continue Purchase/);
  assert.match(resume, /checkoutIntentBelongsToOwner/);
  assert.match(resume, /siteBelongsToOwner/);
  assert.match(active, /owner_id\.eq/);
});

test('website webhook requires approved product, exact website and verified owner email', async () => {
  const [webhook, service] = await Promise.all([
    source('app/api/gumroad/webhook/route.js'),
    source('lib/gumroadSubscriptionService.mjs')
  ]);
  assert.match(webhook, /claimGumroadEvent/);
  assert.match(webhook, /SUPPORTED_RESOURCES/);
  assert.match(webhook, /resource_identity_mismatch/);
  assert.match(service, /identifyWebsiteProduct\(payload\)/);
  assert.match(service, /unmatched_or_unapproved_product/);
  assert.match(service, /unmatched_verified_owner_email_mismatch/);
  assert.match(service, /unmatched_missing_website_identity/);
  assert.match(service, /unmatched_existing_subscription_identity_conflict/);
  assert.match(service, /resource: event\.resource_name/);
  assert.doesNotMatch(service, /\.eq\('customer_email', eventEmail\)/);
  assert.doesNotMatch(service, /seller_email/);
  assert.match(service, /sanitizeGumroadPayload\(payload\)/);
});

test('paid publishing requires the exact product bound to the selected plan', async () => {
  const [publish, verify] = await Promise.all([
    source('app/api/site/publish/route.js'),
    source('app/api/checkout/verify/route.js')
  ]);
  assert.match(publish, /websitePlanAccess\(existing\)\.active/);
  assert.match(verify, /productMatches/);
  assert.match(verify, /APPROVED_WEBSITE_PRODUCTS\[expected\]/);
});

test('client draft state cannot grant a paid plan or extra-page allowance', async () => {
  const [draft, save, getSite, editor] = await Promise.all([
    source('app/api/site/draft/route.js'),
    source('app/api/site/save/route.js'),
    source('app/api/site/get/route.js'),
    source('app/customer/edit/[slug]/page.js')
  ]);
  assert.match(draft, /authoritativePlan = existing\?\.plan \|\| 'free'/);
  assert.match(draft, /extra_pages: Math\.max\(0, Number\(existing\?\.extra_pages\) \|\| 0\)/);
  assert.doesNotMatch(draft, /extra_pages: Number\(site\.extraPages/);
  assert.match(save, /authoritativePlan = existing\.plan \|\| 'free'/);
  assert.doesNotMatch(save, /plan: site\.plan/);
  assert.doesNotMatch(save, /extra_pages: Number\(site\.extraPages/);
  assert.match(getSite, /extraPageAccess\(row\)\.allowance/);
  assert.doesNotMatch(editor, /NEXT_PUBLIC_EXTRA_PAGE_SUBSCRIPTION_CHECKOUT_URL/);
  assert.match(editor, /Purchase Extra Page/);
});

test('an active paid add-on expands section allowance without changing Premium', () => {
  assert.equal(planSectionLimit('starter'), 4);
  assert.equal(planSectionLimit('starter', 2), 6);
  assert.equal(planSectionLimit('business', 1), 7);
  assert.equal(planSectionLimit('premium', 20), 99);
  assert.equal(normalizeSelectedPagesForPlan(['Home', 'About', 'Services', 'Gallery', 'FAQ'], 'starter', 1).length, 5);
});

test('extra-page checkout no longer calls an undefined browser variable', async () => {
  const builder = await source('app/builder/page.js');
  assert.doesNotMatch(builder, /checkout\.extra/);
  assert.match(builder, /async function checkoutExtraPage\(existingIntentId = ''\)/);
  assert.match(builder, /ensureCheckoutIntent\('extra'/);
  assert.match(builder, /continueServerCheckout\(intentId, draft\.slug\)/);
  assert.match(builder, /\/checkout\/continue\?intent=/);
});
