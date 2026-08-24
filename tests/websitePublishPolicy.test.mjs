import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_WEBSITE_PRODUCTS } from '../lib/gumroadWebsiteProducts.mjs';
import { enforceFreePublishingLimits, missingSelectedActionDestination, publishPlanDecision } from '../lib/websitePublishPolicy.mjs';

function paidRow(plan, overrides = {}) {
  return {
    plan,
    site: { plan },
    subscription_status: 'active',
    access_status: 'active',
    gumroad_product_id: APPROVED_WEBSITE_PRODUCTS[plan].productId,
    ...overrides
  };
}

test('unpaid Business and Premium publishing fail closed even when an intent exists', () => {
  for (const plan of ['business', 'premium']) {
    const result = publishPlanDecision({ plan, site: { plan }, subscription_status: 'unverified', access_status: 'active' }, { plan }, { plan });
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'ENTITLEMENT_REQUIRED');
  }
});

test('an exact paid entitlement authorizes only its matching plan', () => {
  assert.equal(publishPlanDecision(paidRow('business'), { plan: 'business' }, { plan: 'business' }).allowed, true);
  assert.equal(publishPlanDecision(paidRow('business'), { plan: 'premium' }, { plan: 'business' }).code, 'PLAN_CONFLICT');
});

test('a legacy Free row with a paid Builder payload or paid checkout intent cannot publish as Free', () => {
  const row = { plan: 'free', site: { plan: 'business' }, subscription_status: 'unverified', access_status: 'active' };
  assert.equal(publishPlanDecision(row, { plan: 'free' }, { plan: 'business' }).code, 'PAYMENT_REQUIRED');
});

test('Free publishing removes paid media and enforces the three-section limit', () => {
  const limited = enforceFreePublishingLimits({ plan: 'business', pages: ['Home', 'Services', 'Gallery', 'FAQ'], heroImage: 'data:image/jpeg;base64,x', heroMediaLink: 'https://video.example', media: [{ url: 'https://image.example' }] });
  assert.equal(limited.plan, 'free');
  assert.equal(limited.pages.length, 3);
  assert.equal(limited.heroImage, '');
  assert.deepEqual(limited.media, []);
});

test('CTA destination is required only when the action section is selected', () => {
  const action = [{ type: 'book', label: 'Book Now', value: '' }];
  assert.equal(missingSelectedActionDestination({ pages: ['Home'], customerActions: action }, 'free'), null);
  assert.equal(missingSelectedActionDestination({ pages: ['Home', 'Order / Book / Buy'], customerActions: action }, 'free').fieldId, 'customer-action-destination-0');
});
