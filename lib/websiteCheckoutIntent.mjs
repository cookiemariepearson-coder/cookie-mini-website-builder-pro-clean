import { createHash, randomUUID } from 'crypto';
import { WEBSITE_CHECKOUTS, builderCheckoutReturnPath, websiteCheckoutRoute } from './commerceConfig.mjs';

export const WEBSITE_CHECKOUT_INTENT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function normalizeWebsiteCheckoutPlan(value = '') {
  const plan = String(value || '').trim().toLowerCase();
  return WEBSITE_CHECKOUTS[plan] ? plan : '';
}

export function normalizeWebsiteCheckoutIntentId(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ? id : '';
}

export function normalizeCheckoutDraftSlug(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 60);
}

export function checkoutIntentEmailHash(email = '') {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized ? createHash('sha256').update(normalized).digest('hex') : '';
}

export function websiteCheckoutCorrelationId(intentId = '') {
  const id = normalizeWebsiteCheckoutIntentId(intentId);
  return id ? createHash('sha256').update(`website-checkout:${id}`).digest('hex').slice(0, 16) : 'missing';
}

export function traceWebsiteCheckout(event = '', intent = {}, details = {}) {
  const safeEvent = String(event || '').replace(/[^A-Z0-9_]/gi, '').slice(0, 64) || 'UNKNOWN';
  const state = websiteCheckoutIntentState(intent);
  const plan = state.ok ? state.plan : normalizeWebsiteCheckoutPlan(intent?.plan);
  console.info('[paid-checkout-trace]', {
    event: safeEvent,
    correlationId: websiteCheckoutCorrelationId(intent?.id),
    plan: plan || 'unknown',
    status: String(intent?.status || 'unknown').slice(0, 32),
    reasonCode: String(details.reasonCode || '').replace(/[^A-Z0-9_]/gi, '').slice(0, 64) || undefined
  });
}

export function checkoutIntentRequestFromReturnPath(value = '') {
  const path = String(value || '').trim();
  try {
    const parsed = new URL(path, 'https://checkout-intent.invalid');
    if (parsed.origin !== 'https://checkout-intent.invalid' || parsed.pathname !== '/builder') return null;
    const plan = normalizeWebsiteCheckoutPlan(parsed.searchParams.get('checkout'));
    if (!plan) return null;
    const allowed = [...parsed.searchParams.keys()].every(key => key === 'checkout' || key === 'draft');
    if (!allowed) return null;
    return { plan, draftSlug: normalizeCheckoutDraftSlug(parsed.searchParams.get('draft')) };
  } catch {
    return null;
  }
}

export function newWebsiteCheckoutIntent({ id = randomUUID(), plan = '', draftSlug = '', email = '', ownerId = '', now = Date.now() } = {}) {
  const intentId = normalizeWebsiteCheckoutIntentId(id);
  const selectedPlan = normalizeWebsiteCheckoutPlan(plan);
  if (!intentId || !selectedPlan) return null;
  return {
    id: intentId,
    plan: selectedPlan,
    draft_slug: normalizeCheckoutDraftSlug(draftSlug) || null,
    email_hash: checkoutIntentEmailHash(email) || null,
    owner_id: String(ownerId || '').trim() || null,
    status: ownerId ? 'ready' : 'pending_auth',
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + WEBSITE_CHECKOUT_INTENT_MAX_AGE_MS).toISOString()
  };
}

export function websiteCheckoutIntentState(row = {}, now = Date.now()) {
  const id = normalizeWebsiteCheckoutIntentId(row.id);
  const plan = normalizeWebsiteCheckoutPlan(row.plan);
  const status = String(row.status || '').trim().toLowerCase();
  const expiresAt = Date.parse(row.expires_at || '');
  if (!id || !plan || !['pending_auth', 'ready', 'checkout_started'].includes(status)) return { ok: false, reason: 'invalid' };
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return { ok: false, reason: 'expired' };
  if (status === 'checkout_started') return { ok: false, reason: 'used' };
  return {
    ok: true,
    id,
    plan,
    draftSlug: normalizeCheckoutDraftSlug(row.draft_slug),
    ownerId: String(row.owner_id || '').trim(),
    emailHash: String(row.email_hash || '').trim(),
    status,
    checkoutPath: websiteCheckoutRoute(plan)
  };
}

export function checkoutIntentBelongsToOwner(row = {}, owner = {}) {
  const state = websiteCheckoutIntentState(row);
  if (!state.ok) return false;
  const ownerId = String(owner.user?.id || owner.id || '').trim();
  const emailHash = checkoutIntentEmailHash(owner.email || '');
  if (state.ownerId && state.ownerId !== ownerId) return false;
  if (state.emailHash && state.emailHash !== emailHash) return false;
  return Boolean(ownerId && emailHash);
}

export function checkoutIntentBuilderPath(row = {}, { resume = false } = {}) {
  const state = websiteCheckoutIntentState(row);
  if (!state.ok) return '/customer';
  const params = new URLSearchParams({ checkoutIntent: state.id });
  if (state.draftSlug) params.set('draft', state.draftSlug);
  if (resume) params.set('resumeCheckout', '1');
  return `/builder?${params.toString()}`;
}

export function checkoutIntentLegacyBuilderPath(row = {}) {
  const state = websiteCheckoutIntentState(row);
  return state.ok ? builderCheckoutReturnPath(state.plan, state.draftSlug) : '/customer';
}
