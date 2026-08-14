import { APPROVED_WEBSITE_PRODUCTS } from './gumroadWebsiteProducts.mjs';
import { websitePlanAccess } from './subscriptionLifecycle.mjs';

export const VIDEO_ENTITLEMENT_STATE = Object.freeze({
  PLANNING: 'planning',
  CHECKING: 'checking',
  VERIFIED_STANDALONE: 'verified-standalone',
  VERIFIED_WEBSITE: 'verified-website',
  NO_CREDIT: 'no-credit',
  INVALID: 'invalid',
  ERROR: 'error'
});

function clean(value = '') {
  return String(value || '').trim().toLowerCase();
}

function siteObject(row = {}) {
  if (row.site && typeof row.site === 'object') return row.site;
  if (typeof row.site === 'string') {
    try { return JSON.parse(row.site); } catch { return {}; }
  }
  return {};
}

export function normalizeVideoPlan(value = '') {
  const plan = clean(value);
  if (plan.includes('premium')) return 'premium';
  if (plan.includes('business')) return 'business';
  if (plan.includes('starter')) return 'starter';
  return 'free';
}

export function configuredVideoLimits(env = {}) {
  const limit = (value, fallback) => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  };
  return {
    free: 0,
    starter: limit(env.HEYGEN_STARTER_MONTHLY_LIMIT, 0),
    business: limit(env.HEYGEN_BUSINESS_MONTHLY_LIMIT, 1),
    premium: limit(env.HEYGEN_PREMIUM_MONTHLY_LIMIT, 3)
  };
}

export function standaloneVideoEntitlement(jobCount = 0) {
  const used = Math.min(1, Math.max(0, Number(jobCount) || 0));
  const remaining = 1 - used;
  return {
    serverVerified: true,
    state: remaining > 0 ? VIDEO_ENTITLEMENT_STATE.VERIFIED_STANDALONE : VIDEO_ENTITLEMENT_STATE.NO_CREDIT,
    kind: 'standalone',
    plan: 'standalone',
    used,
    limit: 1,
    remaining,
    generationAllowed: remaining > 0
  };
}

export function websiteVideoEntitlement(website = {}, { now = new Date(), limits = configuredVideoLimits() } = {}) {
  const embedded = siteObject(website);
  const plan = normalizeVideoPlan(
    website.plan || website.billing_plan || website.subscription_plan ||
    embedded.plan || embedded.selectedPlan || embedded.packageName || embedded.package
  );
  const status = clean(website.status || embedded.status || 'draft');
  const active = websitePlanAccess(website, { now }).active &&
    !['paused', 'archived', 'inactive'].includes(status);
  const eligible = ['business', 'premium'].includes(plan);
  const productMatches = Boolean(
    eligible &&
    APPROVED_WEBSITE_PRODUCTS[plan]?.productId &&
    String(website.gumroad_product_id || '') === APPROVED_WEBSITE_PRODUCTS[plan].productId
  );
  const month = now.toISOString().slice(0, 7);
  const used = website.video_month_key === month ? Math.max(0, Number(website.video_usage_month || 0)) : 0;
  const limit = Math.max(0, Number(limits[plan] || 0) + Number(website.video_bonus_credits || 0));
  const remaining = Math.max(0, limit - used);

  if (!active || !eligible || !productMatches || limit <= 0) {
    return {
      serverVerified: true,
      state: VIDEO_ENTITLEMENT_STATE.INVALID,
      kind: 'website-plan',
      plan,
      month,
      used,
      limit,
      remaining: 0,
      generationAllowed: false
    };
  }

  return {
    serverVerified: true,
    state: remaining > 0 ? VIDEO_ENTITLEMENT_STATE.VERIFIED_WEBSITE : VIDEO_ENTITLEMENT_STATE.NO_CREDIT,
    kind: 'website-plan',
    plan,
    month,
    used,
    limit,
    remaining,
    generationAllowed: remaining > 0
  };
}

export function generationIsAuthorized(entitlement = {}) {
  return entitlement.serverVerified === true && entitlement.generationAllowed === true &&
    Number(entitlement.remaining) > 0 &&
    [VIDEO_ENTITLEMENT_STATE.VERIFIED_STANDALONE, VIDEO_ENTITLEMENT_STATE.VERIFIED_WEBSITE].includes(entitlement.state);
}
