import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reconcileBuilderPlan } from '../lib/builderPlanAuthority.mjs';
import { APPROVED_WEBSITE_PRODUCTS } from '../lib/gumroadWebsiteProducts.mjs';
import { publishPlanDecision } from '../lib/websitePublishPolicy.mjs';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('My Websites Continue Editing uses the immutable website ID and restores the five-step Builder', async () => {
  const [dashboard, builder, getSite] = await Promise.all([
    source('app/customer/page.js'),
    source('app/builder/page.js'),
    source('app/api/site/get/route.js')
  ]);
  assert.match(dashboard, /builder\?website=\$\{encodeURIComponent\(row\.id\)\}/);
  assert.match(builder, /params\.get\('website'\)/);
  assert.match(builder, /id=\$\{encodeURIComponent\(websiteId\)\}/);
  assert.match(builder, /setStep\(Number\.isInteger\(restoredStep\)/);
  assert.match(getSite, /websiteId: data\.id/);
  assert.match(getSite, /draftId: data\.id/);
});

test('full Builder restoration preserves plan, design, sections, wording, media and CTA destination', () => {
  const original = {
    websiteId: '11111111-1111-4111-8111-111111111111',
    draftId: '11111111-1111-4111-8111-111111111111',
    builderStep: 3,
    plan: 'business', typeKey: 'beauty', styleKey: 'luxury-salon', primaryColor: '#111111',
    pages: ['Home', 'Services', 'Order / Book / Buy'],
    sections: { Services: 'Saved wording', 'Order / Book / Buy': 'Book today' },
    media: [{ kind: 'link', url: 'https://example.com/media', section: 'Services' }],
    customerActions: [{ type: 'book', label: 'Book Now', value: 'https://example.com/book', note: 'Saved' }]
  };
  const restored = reconcileBuilderPlan(original, 'business').site;
  for (const key of ['websiteId', 'draftId', 'builderStep', 'plan', 'typeKey', 'styleKey', 'primaryColor']) assert.equal(restored[key], original[key]);
  assert.deepEqual(restored.pages, original.pages);
  assert.deepEqual(restored.sections, original.sections);
  assert.deepEqual(restored.media, original.media);
  assert.equal(restored.customerActions[0].value, 'https://example.com/book');
});

test('selecting the action section immediately renders type and destination controls', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /selectedSections\.map/);
  assert.match(builder, /<CustomerActionEditor/);
  assert.match(builder, /label="Action type"/);
  assert.match(builder, /id=\{`customer-action-destination-\$\{index\}`\}/);
});

test('unpaid Business and Premium show checkout wording while paid entitlement enables Save and Publish', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /Save Draft and Continue to Secure Checkout/);
  assert.match(builder, /paidPublishAllowed \?/);
  assert.match(builder, /onClick=\{publishPaid\}[\s\S]*Save and Publish/);
  for (const plan of ['business', 'premium']) {
    const unpaid = { plan, site: { plan }, subscription_status: 'unverified', access_status: 'active' };
    assert.equal(publishPlanDecision(unpaid, { plan }, { plan }).allowed, false);
    const paid = { ...unpaid, subscription_status: 'active', gumroad_product_id: APPROVED_WEBSITE_PRODUCTS[plan].productId };
    assert.equal(publishPlanDecision(paid, { plan }, { plan }).allowed, true);
  }
});

test('successful publishing removes the duplicate publish action and exposes clear next steps', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /site\.status === 'published'/);
  assert.match(builder, /View Published Website/);
  assert.match(builder, /Go to My Websites/);
  assert.match(builder, /Continue Editing/);
  assert.match(builder, /if \(publishBusy \|\| site\.status === 'published'\) return/);
  assert.match(builder, /disabled=\{publishBusy\}/);
});

test('every authenticated Builder step includes the shared account menu and safe Sign Out', async () => {
  const [builder, accountLink, provider] = await Promise.all([
    source('app/builder/page.js'),
    source('components/CustomerAccountLink.js'),
    source('components/AccountModalProvider.js')
  ]);
  assert.match(builder, /<CustomerAccountLink \/>/);
  assert.match(accountLink, /Sign Out/);
  assert.match(accountLink, /onClick=\{signOut\}/);
  assert.match(provider, /\/api\/auth\/site-owner\/signout/);
  assert.match(provider, /localStorage\.removeItem\(LEGACY_AUTH_TOKEN_KEY\)/);
  assert.match(provider, /window\.location\.assign\('\/'\)/);
});

test('Business and Premium checkout remain bound to exact centralized Gumroad routes', async () => {
  const [commerce, builder] = await Promise.all([source('lib/commerceConfig.mjs'), source('app/builder/page.js')]);
  assert.match(commerce, /business:[\s\S]*\/checkout\/business/);
  assert.match(commerce, /premium:[\s\S]*\/checkout\/premium/);
  assert.match(builder, /continueServerCheckout\(intentId, draft\.slug\)/);
  assert.match(builder, /Business — \$30\/mo|plans\[site\.plan\]\?\.price/);
});

test('legacy URL is a deliberate full-Builder conversion and cannot publish directly', async () => {
  const [legacy, draft, publish] = await Promise.all([
    source('app/customer/edit/[slug]/page.js'),
    source('app/api/site/draft/route.js'),
    source('app/api/site/publish/route.js')
  ]);
  assert.match(legacy, /convert=legacy/);
  assert.doesNotMatch(legacy, /Save and Publish|Save & Publish|fetch\('/);
  assert.match(draft, /authoritativePlan = storedPlan/);
  assert.match(draft, /protectedSite = \{ \.\.\.site/);
  assert.match(publish, /publishPlanDecision/);
  assert.match(publish, /You do not have access to publish this website/);
});
