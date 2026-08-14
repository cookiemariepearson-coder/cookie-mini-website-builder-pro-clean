import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { APPROVED_WEBSITE_PRODUCTS } from '../lib/gumroadWebsiteProducts.mjs';
import { fetchGumroadSubscriptionEvidence } from '../lib/gumroadSubscriptionApi.mjs';
import {
  SUBSCRIPTION_STATES,
  authoritativeSubscriptionTransition,
  customerSubscriptionSummary,
  extraPageAccess,
  maskCustomerIdentifier,
  providerEventReference,
  providerWebsiteSlug,
  transitionWebsiteUpdates,
  webhookSubscriptionTransition,
  websitePlanAccess
} from '../lib/subscriptionLifecycle.mjs';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const product = APPROVED_WEBSITE_PRODUCTS.business;
const baseWebsite = {
  id: 'website-1',
  slug: 'cookie-shop',
  plan: 'business',
  status: 'published',
  access_status: 'active',
  subscription_status: 'active',
  gumroad_product_id: product.productId,
  gumroad_sale_id: 'sale-1',
  gumroad_subscription_id: 'subscription-1',
  customer_email: 'customer@example.com',
  subscription_state_event_at: '2026-08-01T12:00:00.000Z'
};
const payload = {
  product_id: product.productId,
  product_permalink: product.permalink,
  user_email: 'customer@example.com',
  website_slug: 'cookie-shop',
  subscription_id: 'subscription-1'
};

test('provider references are stable, category-scoped, and do not expose raw fallback data', () => {
  assert.equal(providerEventReference('sale', { sale_id: 'sale-1' }), 'sale:sale:sale-1');
  assert.notEqual(providerEventReference('sale', { sale_id: 'sale-1' }), providerEventReference('refund', { sale_id: 'sale-1' }));
  const fallback = providerEventReference('sale', { private_value: 'do-not-store' });
  assert.match(fallback, /^sale:hash:[a-f0-9]{64}$/);
  assert.doesNotMatch(fallback, /do-not-store/);
});

test('website identity supports Gumroad JSON custom fields without using email matching', () => {
  assert.equal(providerWebsiteSlug({ custom_fields: JSON.stringify([{ name: 'Website name or subdomain', value: 'Cookie Shop' }]) }), 'cookie-shop');
  assert.equal(providerWebsiteSlug({ custom_fields: { 'Website Address': 'https://cookie-shop.cookiesdigitalcreations.com' } }), 'cookie-shop');
});

test('active website access requires the exact product identity', () => {
  assert.equal(websitePlanAccess(baseWebsite).active, true);
  assert.deepEqual(websitePlanAccess({ ...baseWebsite, gumroad_product_id: 'wrong-product' }), {
    active: false,
    paid: true,
    reason: 'product_mismatch',
    state: 'active'
  });
});

test('pending cancellation stays active only through the verified paid period', () => {
  const row = { ...baseWebsite, subscription_status: 'pending_cancellation', subscription_end_at: '2026-09-01T00:00:00Z' };
  assert.equal(websitePlanAccess(row, { now: new Date('2026-08-31T23:59:59Z') }).active, true);
  assert.equal(websitePlanAccess(row, { now: new Date('2026-09-01T00:00:00Z') }).active, false);
});

test('a recurring sale becomes renewal success and advances the expected renewal date', () => {
  const result = webhookSubscriptionTransition({
    resource: 'sale',
    payload: { ...payload, sale_id: 'sale-2', created_at: '2026-08-01T12:00:00Z', recurrence: 'monthly' },
    existing: baseWebsite,
    receivedAt: '2026-08-01T12:00:01Z'
  });
  assert.equal(result.state, SUBSCRIPTION_STATES.RENEWED);
  assert.equal(result.active, true);
  assert.equal(result.nextRenewalAt, '2026-09-01T12:00:00.000Z');
});

test('cancellation records pending cancellation without removing paid-period access', () => {
  const result = webhookSubscriptionTransition({
    resource: 'cancellation',
    payload: { ...payload, user_requested_cancellation_at: '2026-08-10T12:00:00Z', cancelled_at: '2026-09-01T12:00:00Z' },
    existing: baseWebsite
  });
  assert.equal(result.state, SUBSCRIPTION_STATES.PENDING_CANCELLATION);
  assert.equal(result.active, true);
  assert.equal(result.endAt, '2026-09-01T12:00:00.000Z');
});

test('cancellation without a provider paid-through date stays active but unresolved', () => {
  const result = webhookSubscriptionTransition({
    resource: 'cancellation',
    payload: { ...payload, user_requested_cancellation_at: '2026-08-10T12:00:00Z' },
    existing: baseWebsite
  });
  assert.equal(result.active, true);
  assert.equal(result.review, true);
  assert.equal(result.reason, 'cancellation_end_needs_reconciliation');
});

test('normal and failed subscription endings are distinct inactive states', () => {
  const ended = webhookSubscriptionTransition({ resource: 'subscription_ended', payload: { ...payload, ended_at: '2026-09-01T12:00:00Z', ended_reason: 'cancelled' }, existing: baseWebsite });
  const failed = webhookSubscriptionTransition({ resource: 'subscription_ended', payload: { ...payload, ended_at: '2026-09-01T12:00:00Z', ended_reason: 'failed_payment' }, existing: baseWebsite });
  assert.deepEqual([ended.state, ended.active], [SUBSCRIPTION_STATES.ENDED, false]);
  assert.deepEqual([failed.state, failed.active], [SUBSCRIPTION_STATES.PAYMENT_FAILED, false]);
});

test('subscription restart restores access and clears verified end/failure dates', () => {
  const result = webhookSubscriptionTransition({ resource: 'subscription_restarted', payload: { ...payload, restarted_at: '2026-08-20T12:00:00Z' }, existing: { ...baseWebsite, subscription_status: 'ended' } });
  assert.equal(result.state, SUBSCRIPTION_STATES.RESTARTED);
  assert.equal(result.active, true);
  assert.equal(result.endAt, null);
  assert.equal(result.failedAt, null);
});

test('refund webhooks distinguish full, partial, and unverified refund review', () => {
  const full = webhookSubscriptionTransition({ resource: 'refund', payload: { ...payload, sale_id: 'sale-1', refunded: true }, existing: baseWebsite });
  const partial = webhookSubscriptionTransition({ resource: 'refund', payload: { ...payload, sale_id: 'sale-1', partially_refunded: true }, existing: baseWebsite });
  const review = webhookSubscriptionTransition({ resource: 'refund', payload: { ...payload, sale_id: 'sale-1' }, existing: baseWebsite });
  assert.deepEqual([full.state, full.active], [SUBSCRIPTION_STATES.FULLY_REFUNDED, false]);
  assert.deepEqual([partial.state, partial.active, partial.review], [SUBSCRIPTION_STATES.PARTIALLY_REFUNDED, true, true]);
  assert.deepEqual([review.state, review.active, review.review], [SUBSCRIPTION_STATES.REFUND_REVIEW, true, true]);
});

test('dispute review pauses access while dispute won restores the prior verified state', () => {
  const dispute = webhookSubscriptionTransition({ resource: 'dispute', payload, existing: baseWebsite });
  const won = webhookSubscriptionTransition({ resource: 'dispute_won', payload, existing: { ...baseWebsite, subscription_status: 'dispute_review', subscription_state_before_review: 'active' } });
  assert.deepEqual([dispute.state, dispute.active], [SUBSCRIPTION_STATES.DISPUTE_REVIEW, false]);
  assert.deepEqual([won.state, won.active], [SUBSCRIPTION_STATES.ACTIVE, true]);
});

test('older and conflicting cancellation events require review instead of overwriting state', () => {
  const older = webhookSubscriptionTransition({ resource: 'subscription_ended', payload: { ...payload, ended_at: '2026-07-01T00:00:00Z' }, existing: baseWebsite });
  const conflict = webhookSubscriptionTransition({ resource: 'cancellation', payload: { ...payload, user_requested_cancellation_at: '2026-08-20T00:00:00Z' }, existing: { ...baseWebsite, subscription_status: 'restarted' } });
  assert.equal(older.apply, false);
  assert.equal(older.reason, 'older_than_current_verified_state');
  assert.equal(conflict.apply, false);
  assert.equal(conflict.reason, 'cancellation_after_restart_requires_reconciliation');
});

test('authoritative provider states cover alive, cancellation, payment attention, failure, and ended', () => {
  const transition = status => authoritativeSubscriptionTransition({
    subscriber: { id: 'subscription-1', status, user_requested_cancellation_at: '2026-08-10T00:00:00Z', cancelled_at: '2026-09-01T00:00:00Z', failed_at: '2026-08-15T00:00:00Z' },
    existing: baseWebsite
  });
  assert.equal(transition('alive').state, SUBSCRIPTION_STATES.ACTIVE);
  assert.equal(transition('pending_cancellation').state, SUBSCRIPTION_STATES.PENDING_CANCELLATION);
  assert.equal(transition('pending_failure').state, SUBSCRIPTION_STATES.PAYMENT_ATTENTION);
  assert.equal(transition('failed_payment').state, SUBSCRIPTION_STATES.PAYMENT_FAILED);
  assert.equal(transition('cancelled').state, SUBSCRIPTION_STATES.ENDED);
});

test('authoritative sale evidence distinguishes refund and chargeback review', () => {
  assert.equal(authoritativeSubscriptionTransition({ sale: { refunded: true }, existing: baseWebsite }).state, SUBSCRIPTION_STATES.FULLY_REFUNDED);
  assert.equal(authoritativeSubscriptionTransition({ sale: { partially_refunded: true }, existing: baseWebsite }).state, SUBSCRIPTION_STATES.PARTIALLY_REFUNDED);
  assert.equal(authoritativeSubscriptionTransition({ sale: { chargedback: true }, existing: baseWebsite }).state, SUBSCRIPTION_STATES.DISPUTE_REVIEW);
});

test('website transition updates preserve dates not addressed by a review transition', () => {
  const updates = transitionWebsiteUpdates(baseWebsite, {
    apply: true,
    state: SUBSCRIPTION_STATES.PARTIALLY_REFUNDED,
    active: true,
    review: true,
    eventAt: '2026-08-20T00:00:00Z'
  }, { product, payload, receivedAt: '2026-08-20T00:00:01Z' });
  assert.equal('subscription_end_at' in updates, false);
  assert.equal(updates.subscription_status, SUBSCRIPTION_STATES.PARTIALLY_REFUNDED);
  assert.equal(updates.access_status, 'active');
});

test('an archived site is never silently republished by a provider transition', () => {
  const updates = transitionWebsiteUpdates({ ...baseWebsite, status: 'archived', access_status: 'archived' }, {
    apply: true,
    state: SUBSCRIPTION_STATES.RESTARTED,
    active: true,
    review: false,
    eventAt: '2026-08-20T00:00:00Z'
  }, { product, payload, receivedAt: '2026-08-20T00:00:01Z' });
  assert.equal(updates.status, 'archived');
  assert.equal(updates.access_status, 'archived');
  const deleted = transitionWebsiteUpdates({ ...baseWebsite, status: 'deleted', customer_deleted_at: '2026-08-14T15:00:00Z' }, {
    apply: true,
    state: SUBSCRIPTION_STATES.RESTARTED,
    active: true,
    review: false,
    eventAt: '2026-08-20T00:00:00Z'
  }, { product, payload, receivedAt: '2026-08-20T00:00:01Z' });
  assert.equal(deleted.status, 'deleted');
  assert.equal(deleted.access_status, 'active');
  assert.equal(websitePlanAccess({ ...baseWebsite, status: 'deleted' }).active, true);
});

test('extra-page access requires exact add-on identity plus active eligible base access', () => {
  const row = { ...baseWebsite, plan: 'starter', gumroad_product_id: APPROVED_WEBSITE_PRODUCTS.starter.productId, extra_page_subscription_status: 'active', extra_page_gumroad_product_id: APPROVED_WEBSITE_PRODUCTS.extra.productId, extra_pages: 2 };
  assert.equal(extraPageAccess(row).allowance, 2);
  assert.equal(extraPageAccess({ ...row, extra_page_gumroad_product_id: 'wrong' }).allowance, 0);
  assert.equal(extraPageAccess({ ...row, access_status: 'paused' }).allowance, 0);
});

test('customer summaries are honest for free, active, cancellation, and ended states', () => {
  assert.equal(customerSubscriptionSummary({ plan: 'free' }).label, 'Free plan');
  assert.equal(customerSubscriptionSummary(baseWebsite).label, 'Active');
  const pending = customerSubscriptionSummary({ ...baseWebsite, subscription_status: 'pending_cancellation', subscription_end_at: '2026-09-01T00:00:00Z' }, { now: new Date('2026-08-20T00:00:00Z') });
  assert.match(pending.label, /access continues through/);
  const ended = customerSubscriptionSummary({ ...baseWebsite, subscription_status: 'ended', access_status: 'paused' });
  assert.equal(ended.label, 'Plan ended');
  assert.match(pending.management, /receipt.*Library/i);
});

test('event review masks customer identifiers', () => {
  assert.equal(maskCustomerIdentifier('customer@example.com'), 'c******@example.com');
  assert.equal(maskCustomerIdentifier(''), 'Unavailable');
});

test('provider recheck uses subscriber and sale reads without incrementing license use', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      json: async () => url.includes('/subscribers/')
        ? { success: true, subscriber: { id: 'subscription-1', user_email: 'customer@example.com', product_id: product.productId, status: 'alive' } }
        : { success: true, sale: { id: 'sale-1', purchase_email: 'customer@example.com', product_id: product.productId, subscription_id: 'subscription-1' } }
    };
  };
  const result = await fetchGumroadSubscriptionEvidence({ subscriptionId: 'subscription-1', saleId: 'sale-1', accessToken: 'server-secret', fetchImpl });
  assert.equal(result.subscriber.status, 'alive');
  assert.equal(result.sale.subscription_id, 'subscription-1');
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.init.cache === 'no-store'));
  assert.ok(calls.every(call => !/licenses|increment_uses_count/.test(call.url)));
});

test('event claiming and failed retries are idempotent and database-atomic', async () => {
  const service = await source('lib/gumroadSubscriptionService.mjs');
  assert.match(service, /from\('gumroad_events'\)\.insert\(record\)/);
  assert.match(service, /error\.code !== '23505'/);
  assert.match(service, /\.eq\('processing_status', 'failed'\)/);
  assert.match(service, /older_than_current_verified_state/);
});

test('owner review is authenticated, masked, and requires preview before reconcile', async () => {
  const [route, list, service, manual, adminUpdate, checkoutVerify, registerWebhooks, siteDraft, siteGet, sitePublish, siteSave] = await Promise.all([
    source('app/api/admin/subscriptions/events/route.js'),
    source('app/api/admin/subscriptions/list/route.js'),
    source('lib/gumroadSubscriptionService.mjs'),
    source('app/api/admin/subscriptions/manual-update/route.js'),
    source('app/api/admin/update/route.js'),
    source('app/api/checkout/verify/route.js'),
    source('app/api/gumroad/register-webhooks/route.js'),
    source('app/api/site/draft/route.js'),
    source('app/api/site/get/route.js'),
    source('app/api/site/publish/route.js'),
    source('app/api/site/save/route.js')
  ]);
  assert.match(route, /getVerifiedAdmin/);
  assert.match(list, /maskCustomerIdentifier/);
  assert.doesNotMatch(list, /select\('\*'\)/);
  assert.match(service, /Run Recheck before applying reconciliation/);
  assert.doesNotMatch(manual, /safe\.plan|safe\.access_status|safe\.subscription_status/);
  for (const privateRoute of [route, list, manual, adminUpdate, checkoutVerify, registerWebhooks, siteDraft, siteGet, sitePublish, siteSave]) {
    assert.match(privateRoute, /'Cache-Control': 'private, no-store, max-age=0'/);
  }
});

test('migration keeps event data server-only and adds unique provider identities', async () => {
  const migration = await source('supabase/migrations/20260812120000_subscription_event_reliability.sql');
  assert.match(migration, /alter table public\.gumroad_events enable row level security/);
  assert.match(migration, /revoke all on table public\.gumroad_events from anon, authenticated, service_role/);
  assert.match(migration, /revoke all on sequence public\.gumroad_events_id_seq from anon, authenticated, service_role/);
  assert.match(migration, /grant select, insert, update on table public\.gumroad_events to service_role/);
  assert.doesNotMatch(migration, /grant .*delete.*gumroad_events.*service_role/i);
  assert.match(migration, /gumroad_events_provider_event_id_unique/);
  assert.match(migration, /websites_gumroad_subscription_id_unique/);
  assert.match(migration, /processing_status text not null/);
});
