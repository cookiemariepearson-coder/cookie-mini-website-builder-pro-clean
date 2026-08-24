import { normalizeSelectedPagesForPlan, normalizeCustomerActions, plans } from './siteDefaults.js';

const PAID_WEBSITE_PLANS = new Set(['starter', 'business', 'premium']);

export function normalizeAuthoritativeWebsitePlan(value = '') {
  const plan = String(value || '').trim().toLowerCase();
  return PAID_WEBSITE_PLANS.has(plan) ? plan : '';
}

export function isKnownBuilderPlan(value = '') {
  return Boolean(plans[String(value || '').trim().toLowerCase()]);
}

export function reconcileBuilderPlan(draft = {}, authoritativePlan = '') {
  const authority = normalizeAuthoritativeWebsitePlan(authoritativePlan);
  const draftPlan = String(draft?.plan || '').trim().toLowerCase();
  const plan = authority || (isKnownBuilderPlan(draftPlan) ? draftPlan : 'free');
  const site = {
    ...draft,
    plan,
    pages: normalizeSelectedPagesForPlan(
      Array.isArray(draft?.pages) && draft.pages.length ? draft.pages : ['Home'],
      plan,
      draft?.extraPages || draft?.extra_pages
    ),
    customerActions: normalizeCustomerActions(draft?.customerActions, plan)
  };

  return {
    ok: Boolean(plan),
    plan,
    site,
    source: authority ? 'checkout-intent' : (isKnownBuilderPlan(draftPlan) ? 'draft' : 'default')
  };
}

export function planMatchesCheckoutAuthority(sitePlan = '', authoritativePlan = '') {
  const authority = normalizeAuthoritativeWebsitePlan(authoritativePlan);
  return !authority || String(sitePlan || '').trim().toLowerCase() === authority;
}
