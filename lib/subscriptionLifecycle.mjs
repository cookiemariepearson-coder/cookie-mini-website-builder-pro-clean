import { createHash } from 'node:crypto';
import { APPROVED_WEBSITE_PRODUCTS } from './gumroadWebsiteProducts.mjs';

export const SUBSCRIPTION_STATES = Object.freeze({
  ACTIVE: 'active',
  RENEWED: 'renewal_successful',
  PENDING_CANCELLATION: 'pending_cancellation',
  ENDED: 'ended',
  PAYMENT_ATTENTION: 'payment_attention',
  PAYMENT_FAILED: 'payment_failed',
  RESTARTED: 'restarted',
  FULLY_REFUNDED: 'fully_refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUND_REVIEW: 'refund_review',
  DISPUTE_REVIEW: 'dispute_review',
  UNVERIFIED: 'unverified'
});

const ACCESS_STATES = new Set([
  SUBSCRIPTION_STATES.ACTIVE,
  SUBSCRIPTION_STATES.RENEWED,
  SUBSCRIPTION_STATES.PENDING_CANCELLATION,
  SUBSCRIPTION_STATES.PAYMENT_ATTENTION,
  SUBSCRIPTION_STATES.RESTARTED,
  SUBSCRIPTION_STATES.PARTIALLY_REFUNDED,
  SUBSCRIPTION_STATES.REFUND_REVIEW
]);

const clean = (value = '') => String(value || '').trim();
const lower = (value = '') => clean(value).toLowerCase();

export function validProviderDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

export function providerEventReference(resource = '', payload = {}) {
  const category = lower(resource || payload.resource_name || payload.resource || payload.event || 'unknown');
  const saleId = clean(payload.sale_id || payload.id || payload.order_id || payload.purchase_id);
  const subscriptionId = clean(payload.subscription_id || payload.subscription || payload.subscriber_id);
  const explicit = clean(payload.event_id || payload.webhook_id);
  if (explicit) return `${category}:event:${explicit}`;
  if (['sale', 'refund', 'dispute', 'dispute_won'].includes(category) && saleId) return `${category}:sale:${saleId}`;
  if (subscriptionId) {
    const effective = clean(
      payload.restarted_at || payload.ended_at || payload.user_requested_cancellation_at ||
      payload.cancelled_at || payload.effective_as_of || ''
    );
    if (effective) return `${category}:subscription:${subscriptionId}:${effective}`;
    return `${category}:subscription:${subscriptionId}`;
  }
  const digest = createHash('sha256').update(JSON.stringify(stableValue(payload))).digest('hex');
  return `${category}:hash:${digest}`;
}

export function providerEventAt(resource = '', payload = {}, receivedAt = new Date().toISOString()) {
  const category = lower(resource);
  const candidate = category === 'sale'
    ? payload.sale_timestamp || payload.created_at
    : category === 'subscription_ended'
      ? payload.ended_at
      : category === 'subscription_restarted'
        ? payload.restarted_at
        : category === 'subscription_updated'
          ? payload.effective_as_of
          : category === 'cancellation'
            ? payload.user_requested_cancellation_at
            : null;
  return validProviderDate(candidate) || validProviderDate(receivedAt) || new Date().toISOString();
}

export function providerCustomerEmail(payload = {}) {
  return lower(payload.user_email || payload.email || payload.purchaser_email || payload.customer_email || payload.buyer_email);
}

export function providerSaleId(payload = {}) {
  return clean(payload.sale_id || payload.id || payload.order_id || payload.purchase_id);
}

export function providerSubscriptionId(payload = {}) {
  return clean(payload.subscription_id || payload.subscription || payload.subscriber_id);
}

function slugify(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/www\./, '')
    .replace(/\.cookiesdigitalcreations\.com.*$/, '')
    .replace(/cookiesdigitalcreations\.com\/site\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function providerWebsiteSlug(payload = {}) {
  let customFields = payload.custom_fields;
  if (typeof customFields === 'string' && /^[\[{]/.test(customFields.trim())) {
    try { customFields = JSON.parse(customFields); } catch { customFields = null; }
  }
  const directKeys = [
    'website_reference', 'website_slug', 'website_subdomain', 'subdomain', 'slug', 'website_name',
    'preferred_website_name', 'preferred_website_name_subdomain', 'business_slug'
  ];
  for (const key of directKeys) {
    const slug = slugify(payload[key]);
    if (slug) return slug;
  }
  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (!normalizedKey.includes('website') && !normalizedKey.includes('subdomain') && !normalizedKey.includes('site_name')) continue;
    const slug = slugify(value);
    if (slug) return slug;
  }
  if (customFields && typeof customFields === 'object') {
    const entries = Array.isArray(customFields)
      ? customFields.map(item => [item?.name || item?.label || '', item?.value || item?.answer || ''])
      : Object.entries(customFields);
    for (const [key, value] of entries) {
      if (!/(website|subdomain|site name)/i.test(String(key))) continue;
      const slug = slugify(value);
      if (slug) return slug;
    }
  }
  return '';
}

function paidPlan(row = {}) {
  return lower(row.plan || row.site?.plan);
}

function exactBaseProduct(row = {}) {
  const plan = paidPlan(row);
  return Boolean(APPROVED_WEBSITE_PRODUCTS[plan]?.productId) &&
    clean(row.gumroad_product_id) === APPROVED_WEBSITE_PRODUCTS[plan].productId;
}

function beforeOrAt(value, now) {
  const date = validProviderDate(value);
  return Boolean(date && new Date(date).getTime() <= new Date(now).getTime());
}

function expectedRenewalAt(value, recurrence = '') {
  const iso = validProviderDate(value);
  if (!iso) return null;
  const months = { monthly: 1, quarterly: 3, biannually: 6, yearly: 12 }[lower(recurrence)];
  if (!months) return null;
  const date = new Date(iso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
}

export function websitePlanAccess(row = {}, { now = new Date() } = {}) {
  const plan = paidPlan(row);
  if (!['starter', 'business', 'premium'].includes(plan)) {
    return { active: true, paid: false, reason: 'free_plan', state: SUBSCRIPTION_STATES.ACTIVE };
  }
  const state = lower(row.subscription_status || SUBSCRIPTION_STATES.UNVERIFIED);
  if (!exactBaseProduct(row)) return { active: false, paid: true, reason: 'product_mismatch', state };
  if (['archived', 'deleted', 'inactive'].includes(lower(row.access_status)) || ['archived', 'inactive'].includes(lower(row.status))) {
    return { active: false, paid: true, reason: 'site_unavailable', state };
  }
  if (state === SUBSCRIPTION_STATES.PENDING_CANCELLATION && beforeOrAt(row.subscription_end_at, now)) {
    return { active: false, paid: true, reason: 'entitlement_ended', state };
  }
  const active = ACCESS_STATES.has(state) && lower(row.access_status) === 'active';
  return { active, paid: true, reason: active ? 'verified_active' : 'inactive_state', state };
}

export function extraPageAccess(row = {}, { now = new Date() } = {}) {
  const state = lower(row.extra_page_subscription_status || SUBSCRIPTION_STATES.UNVERIFIED);
  const exactProduct = clean(row.extra_page_gumroad_product_id) === APPROVED_WEBSITE_PRODUCTS.extra.productId;
  if (!exactProduct) return { active: false, allowance: 0, reason: 'product_mismatch', state };
  if (state === SUBSCRIPTION_STATES.PENDING_CANCELLATION && beforeOrAt(row.extra_page_subscription_end_at, now)) {
    return { active: false, allowance: 0, reason: 'entitlement_ended', state };
  }
  const active = ACCESS_STATES.has(state) && websitePlanAccess(row, { now }).active;
  return {
    active,
    allowance: active ? Math.max(0, Number(row.extra_pages) || 0) : 0,
    reason: active ? 'verified_active' : 'inactive_state',
    state
  };
}

function restoredSiteStatus(existing = {}) {
  const current = lower(existing.status || 'draft');
  if (current === 'archived' || lower(existing.access_status) === 'archived') return 'archived';
  const previous = lower(existing.site_status_before_billing_hold);
  if (['draft', 'published'].includes(previous)) return previous;
  return current === 'paused' ? 'published' : current;
}

function accessUpdate(existing = {}, active, reason = '') {
  if (lower(existing.status) === 'deleted') {
    return {
      access_status: active ? 'active' : 'paused',
      status: 'deleted',
      paused_reason: active ? null : reason,
      site_status_before_billing_hold: 'deleted'
    };
  }
  if (lower(existing.access_status) === 'archived' || lower(existing.status) === 'archived') {
    return { access_status: 'archived', status: 'archived' };
  }
  if (active) {
    return {
      access_status: 'active',
      status: restoredSiteStatus(existing),
      paused_reason: null,
      site_status_before_billing_hold: null
    };
  }
  return {
    access_status: 'paused',
    status: 'paused',
    paused_reason: reason,
    site_status_before_billing_hold: ['draft', 'published'].includes(lower(existing.status)) ? lower(existing.status) : existing.site_status_before_billing_hold || null
  };
}

function outOfOrder(existingAt, incomingAt) {
  const current = validProviderDate(existingAt);
  const incoming = validProviderDate(incomingAt);
  return Boolean(current && incoming && new Date(incoming).getTime() < new Date(current).getTime());
}

export function webhookSubscriptionTransition({ resource, payload = {}, existing = {}, receivedAt = new Date().toISOString(), extraPage = false } = {}) {
  const category = lower(resource);
  const eventAt = providerEventAt(category, payload, receivedAt);
  const stateAtField = extraPage ? 'extra_page_state_event_at' : 'subscription_state_event_at';
  if (outOfOrder(existing[stateAtField], eventAt)) {
    return { apply: false, review: true, reason: 'older_than_current_verified_state', eventAt };
  }
  if (category === 'cancellation' && lower(existing[extraPage ? 'extra_page_subscription_status' : 'subscription_status']) === SUBSCRIPTION_STATES.RESTARTED) {
    return { apply: false, review: true, reason: 'cancellation_after_restart_requires_reconciliation', eventAt };
  }

  const saleId = providerSaleId(payload);
  const subscriptionId = providerSubscriptionId(payload);
  const endAt = validProviderDate(payload.cancelled_at || payload.ended_at);
  const currentSaleId = clean(extraPage ? existing.extra_page_gumroad_sale_id : existing.gumroad_sale_id);
  const currentSubscriptionId = clean(extraPage ? existing.extra_page_gumroad_subscription_id : existing.gumroad_subscription_id);
  const common = { eventAt, saleId, subscriptionId, apply: true, review: false };

  if (category === 'sale') {
    const renewal = Boolean(currentSubscriptionId && subscriptionId === currentSubscriptionId && currentSaleId && saleId && saleId !== currentSaleId);
    return {
      ...common,
      state: renewal ? SUBSCRIPTION_STATES.RENEWED : SUBSCRIPTION_STATES.ACTIVE,
      active: true,
      endAt: null,
      failedAt: null,
      lastPaymentAt: validProviderDate(payload.sale_timestamp || payload.created_at) || eventAt,
      startedAt: validProviderDate(payload.sale_timestamp || payload.created_at) || eventAt,
      nextRenewalAt: expectedRenewalAt(payload.sale_timestamp || payload.created_at, payload.recurrence),
      reason: renewal ? 'verified_recurring_sale' : 'verified_initial_sale'
    };
  }
  if (category === 'cancellation') {
    return { ...common, state: SUBSCRIPTION_STATES.PENDING_CANCELLATION, active: true, endAt, nextRenewalAt: null, review: !endAt, reason: endAt ? 'verified_cancellation_scheduled' : 'cancellation_end_needs_reconciliation' };
  }
  if (category === 'subscription_ended') {
    const failed = lower(payload.ended_reason) === 'failed_payment' || payload.cancelled_due_to_payment_failures === true;
    return { ...common, state: failed ? SUBSCRIPTION_STATES.PAYMENT_FAILED : SUBSCRIPTION_STATES.ENDED, active: false, endAt: validProviderDate(payload.ended_at) || eventAt, failedAt: failed ? (validProviderDate(payload.ended_at) || eventAt) : null, nextRenewalAt: null, reason: failed ? 'verified_failed_payment_end' : 'verified_subscription_end' };
  }
  if (category === 'subscription_restarted') {
    return { ...common, state: SUBSCRIPTION_STATES.RESTARTED, active: true, endAt: null, failedAt: null, reason: 'verified_restart' };
  }
  if (category === 'subscription_updated') {
    return { ...common, state: SUBSCRIPTION_STATES.ACTIVE, active: true, endAt: null, reason: 'verified_subscription_update' };
  }
  if (category === 'refund') {
    const currentlyActive = extraPage
      ? ACCESS_STATES.has(lower(existing.extra_page_subscription_status))
      : lower(existing.access_status) === 'active';
    if (payload.partially_refunded === true || lower(payload.partially_refunded) === 'true') {
      return { ...common, state: SUBSCRIPTION_STATES.PARTIALLY_REFUNDED, active: currentlyActive, review: true, reason: 'verified_partial_refund' };
    }
    if (payload.refunded === true || lower(payload.refunded) === 'true') {
      return { ...common, state: SUBSCRIPTION_STATES.FULLY_REFUNDED, active: false, endAt: eventAt, nextRenewalAt: null, reason: 'verified_full_refund' };
    }
    return { ...common, state: SUBSCRIPTION_STATES.REFUND_REVIEW, active: currentlyActive, review: true, reason: 'refund_requires_authoritative_reconciliation' };
  }
  if (category === 'dispute') {
    return { ...common, state: SUBSCRIPTION_STATES.DISPUTE_REVIEW, active: false, review: true, reason: 'verified_dispute_review' };
  }
  if (category === 'dispute_won') {
    const previous = lower(existing.subscription_state_before_review);
    const restored = ACCESS_STATES.has(previous) ? previous : SUBSCRIPTION_STATES.ACTIVE;
    return { ...common, state: restored, active: true, endAt: existing.subscription_end_at || null, reason: 'verified_dispute_won' };
  }
  return { ...common, apply: false, review: true, reason: 'unsupported_resource' };
}

export function authoritativeSubscriptionTransition({ subscriber = null, sale = null, existing = {}, receivedAt = new Date().toISOString(), extraPage = false } = {}) {
  const eventAt = validProviderDate(
    subscriber?.restarted_at || subscriber?.ended_at || subscriber?.failed_at || subscriber?.user_requested_cancellation_at ||
    sale?.updated_at || sale?.created_at || receivedAt
  ) || receivedAt;
  if (sale?.chargedback === true || sale?.chargebacked === true || (sale?.disputed === true && sale?.dispute_won !== true)) {
    return { apply: true, review: true, state: SUBSCRIPTION_STATES.DISPUTE_REVIEW, active: false, eventAt, reason: 'authoritative_dispute_review' };
  }
  if (sale?.refunded === true && sale?.partially_refunded !== true) {
    return { apply: true, review: false, state: SUBSCRIPTION_STATES.FULLY_REFUNDED, active: false, eventAt, endAt: eventAt, reason: 'authoritative_full_refund' };
  }
  if (sale?.partially_refunded === true) {
    const active = extraPage
      ? ACCESS_STATES.has(lower(existing.extra_page_subscription_status))
      : lower(existing.access_status) === 'active';
    return { apply: true, review: true, state: SUBSCRIPTION_STATES.PARTIALLY_REFUNDED, active, eventAt, reason: 'authoritative_partial_refund' };
  }
  if (subscriber) {
    const status = lower(subscriber.status);
    if (status === 'alive') return { apply: true, review: false, state: SUBSCRIPTION_STATES.ACTIVE, active: true, eventAt, endAt: null, failedAt: null, nextRenewalAt: expectedRenewalAt(sale?.created_at, subscriber.recurrence || sale?.recurrence), reason: 'authoritative_alive' };
    if (status === 'pending_cancellation') return { apply: true, review: false, state: SUBSCRIPTION_STATES.PENDING_CANCELLATION, active: true, eventAt, endAt: validProviderDate(subscriber.cancelled_at), nextRenewalAt: null, reason: 'authoritative_pending_cancellation' };
    if (status === 'pending_failure') return { apply: true, review: true, state: SUBSCRIPTION_STATES.PAYMENT_ATTENTION, active: true, eventAt, failedAt: validProviderDate(subscriber.failed_at), reason: 'authoritative_pending_failure' };
    if (status === 'failed_payment') return { apply: true, review: false, state: SUBSCRIPTION_STATES.PAYMENT_FAILED, active: false, eventAt, failedAt: validProviderDate(subscriber.failed_at) || eventAt, endAt: validProviderDate(subscriber.ended_at || subscriber.failed_at) || eventAt, nextRenewalAt: null, reason: 'authoritative_failed_payment' };
    if (status === 'fixed_subscription_period_ended' || status === 'cancelled') return { apply: true, review: false, state: SUBSCRIPTION_STATES.ENDED, active: false, eventAt, endAt: validProviderDate(subscriber.ended_at || subscriber.cancelled_at) || eventAt, nextRenewalAt: null, reason: 'authoritative_subscription_ended' };
  }
  return { apply: false, review: true, eventAt, reason: 'authoritative_status_unresolved' };
}

export function transitionWebsiteUpdates(existing = {}, transition = {}, { extraPage = false, product = null, payload = {}, receivedAt = new Date().toISOString() } = {}) {
  if (!transition.apply) return {};
  const stateAtField = extraPage ? 'extra_page_state_event_at' : 'subscription_state_event_at';
  const updates = {
    updated_at: receivedAt,
    [stateAtField]: transition.eventAt
  };
  if (extraPage) {
    updates.extra_page_subscription_status = transition.state;
    if (transition.saleId) updates.extra_page_gumroad_sale_id = transition.saleId;
    if (transition.subscriptionId) updates.extra_page_gumroad_subscription_id = transition.subscriptionId;
    if (product?.productId) updates.extra_page_gumroad_product_id = product.productId;
    if (Object.hasOwn(transition, 'endAt')) updates.extra_page_subscription_end_at = transition.endAt || null;
    updates.extra_page_last_event_at = transition.eventAt;
    if (transition.active) updates.extra_pages = Math.max(Number(existing.extra_pages) || 0, Math.max(1, Math.min(20, Number(payload.quantity) || 1)));
    return updates;
  }
  const access = accessUpdate(existing, transition.active, transition.state === SUBSCRIPTION_STATES.DISPUTE_REVIEW ? 'Payment dispute under review.' : 'Verified subscription access ended.');
  Object.assign(updates, access, {
    subscription_status: transition.state,
    gumroad_last_event_at: transition.eventAt
  });
  if (Object.hasOwn(transition, 'endAt')) updates.subscription_end_at = transition.endAt || null;
  if (Object.hasOwn(transition, 'failedAt')) updates.subscription_failed_at = transition.failedAt || null;
  if (Object.hasOwn(transition, 'nextRenewalAt')) updates.subscription_next_renewal_at = transition.nextRenewalAt || null;
  if (transition.state === SUBSCRIPTION_STATES.DISPUTE_REVIEW || transition.state === SUBSCRIPTION_STATES.REFUND_REVIEW) {
    updates.subscription_state_before_review = existing.subscription_status || SUBSCRIPTION_STATES.UNVERIFIED;
  } else if (!transition.review) {
    updates.subscription_state_before_review = null;
  }
  if (transition.saleId) updates.gumroad_sale_id = transition.saleId;
  if (transition.subscriptionId) updates.gumroad_subscription_id = transition.subscriptionId;
  if (product?.productId) updates.gumroad_product_id = product.productId;
  if (product?.name) updates.gumroad_product_name = product.name;
  if (product?.plan) updates.plan = product.plan;
  if (transition.startedAt && !existing.subscription_started_at) updates.subscription_started_at = transition.startedAt;
  if (transition.lastPaymentAt) updates.last_payment_at = transition.lastPaymentAt;
  return updates;
}

export function maskCustomerIdentifier(value = '') {
  const email = lower(value);
  const at = email.indexOf('@');
  if (at < 1) return 'Unavailable';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(6, local.length - 1)))}@${domain}`;
}

export function customerSubscriptionSummary(row = {}, { now = new Date() } = {}) {
  const plan = paidPlan(row) || 'free';
  const access = websitePlanAccess(row, { now });
  const state = lower(row.subscription_status || SUBSCRIPTION_STATES.UNVERIFIED);
  const endAt = validProviderDate(row.subscription_end_at);
  let label = 'We’re verifying your payment status';
  let nextStep = 'Your website and account data remain safe while Cookie Digital Creations verifies the provider record.';
  if (!access.paid) {
    label = 'Free plan';
    nextStep = 'No Gumroad membership is required for this website.';
  } else if (state === SUBSCRIPTION_STATES.PENDING_CANCELLATION && access.active) {
    label = endAt ? `Cancellation scheduled—access continues through ${new Date(endAt).toLocaleDateString('en-US')}` : 'Cancellation scheduled—end date is being verified';
    nextStep = 'Manage the membership from your latest Gumroad receipt or Gumroad Library.';
  } else if ([SUBSCRIPTION_STATES.ACTIVE, SUBSCRIPTION_STATES.RENEWED, SUBSCRIPTION_STATES.RESTARTED].includes(state) && access.active) {
    label = 'Active';
    nextStep = 'Manage the membership from your latest Gumroad receipt or Gumroad Library.';
  } else if (state === SUBSCRIPTION_STATES.PAYMENT_ATTENTION) {
    label = 'Payment needs attention';
    nextStep = 'Open the membership from your Gumroad receipt or Library to review the payment method.';
  } else if ([SUBSCRIPTION_STATES.ENDED, SUBSCRIPTION_STATES.PAYMENT_FAILED, SUBSCRIPTION_STATES.FULLY_REFUNDED].includes(state) || !access.active && state === SUBSCRIPTION_STATES.PENDING_CANCELLATION) {
    label = 'Plan ended';
    nextStep = 'Contact Cookie Digital Creations if you believe Gumroad still shows an active membership.';
  } else if (state === SUBSCRIPTION_STATES.PARTIALLY_REFUNDED) {
    label = access.active ? 'Active—partial refund recorded' : 'Partial refund under review';
  } else if (state === SUBSCRIPTION_STATES.DISPUTE_REVIEW || state === SUBSCRIPTION_STATES.REFUND_REVIEW) {
    label = 'We’re verifying your payment status';
  }
  const extra = extraPageAccess(row, { now });
  return {
    plan,
    state,
    label,
    active: access.active,
    startedAt: validProviderDate(row.subscription_started_at),
    renewalAt: validProviderDate(row.subscription_next_renewal_at),
    endAt,
    extraPages: extra.allowance,
    nextStep,
    management: access.paid
      ? 'Gumroad memberships are managed from the purchase receipt or the customer’s Gumroad Library.'
      : 'There is no subscription to cancel or refund for this free plan.'
  };
}
