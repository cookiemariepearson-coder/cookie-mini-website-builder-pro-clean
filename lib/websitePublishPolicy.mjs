import { normalizeSelectedPagesForPlan, normalizeCustomerActions } from './siteDefaults.js';
import { websitePlanAccess } from './subscriptionLifecycle.mjs';

const PAID_PLANS = new Set(['starter', 'business', 'premium']);
const PLAN_LABELS = Object.freeze({ free: 'Free', starter: 'Starter Pro', business: 'Business', premium: 'Premium' });

export function normalizeWebsitePlan(value = '') {
  const plan = String(value || '').trim().toLowerCase();
  return ['free', 'starter', 'business', 'premium'].includes(plan) ? plan : '';
}

export function websitePlanLabel(value = '') {
  return PLAN_LABELS[normalizeWebsitePlan(value)] || 'Free';
}

export function publishPlanDecision(row = {}, submittedSite = {}, checkoutIntent = null) {
  const storedPlan = normalizeWebsitePlan(row.plan) || 'free';
  const savedPlan = normalizeWebsitePlan(row.site?.plan);
  const submittedPlan = normalizeWebsitePlan(submittedSite.plan);
  const intentPlan = normalizeWebsitePlan(checkoutIntent?.plan);
  const paidSignals = [...new Set([storedPlan, savedPlan, submittedPlan, intentPlan].filter(plan => PAID_PLANS.has(plan)))];

  if (paidSignals.length > 1) {
    return { allowed: false, plan: '', code: 'PLAN_CONFLICT', message: 'This website has conflicting paid-plan information. Publishing is paused to protect your purchase. Open it from My Websites and continue with the plan shown there.' };
  }

  const intendedPlan = paidSignals[0] || 'free';
  if (PAID_PLANS.has(intendedPlan)) {
    if (storedPlan !== intendedPlan) {
      return { allowed: false, plan: intendedPlan, code: 'PAYMENT_REQUIRED', message: `Your ${websitePlanLabel(intendedPlan)} checkout has not been confirmed. Your website remains saved and unpublished.` };
    }
    const access = websitePlanAccess(row);
    if (!access.active) {
      return { allowed: false, plan: intendedPlan, code: 'ENTITLEMENT_REQUIRED', message: `Your ${websitePlanLabel(intendedPlan)} plan is not verified for this website. Complete checkout and wait for confirmation before publishing.` };
    }
    return { allowed: true, plan: intendedPlan, code: 'VERIFIED_PAID_ENTITLEMENT', access };
  }

  return { allowed: true, plan: 'free', code: 'FREE_PLAN' };
}

export function missingSelectedActionDestination(site = {}, plan = 'free', extraPages = 0) {
  const pages = normalizeSelectedPagesForPlan(site.pages, plan, extraPages);
  if (!pages.includes('Order / Book / Buy') && !pages.includes('Customer Action')) return null;
  const actions = normalizeCustomerActions(site.customerActions, plan);
  const index = actions.findIndex(action => !String(action.value || '').trim());
  if (index < 0) return null;
  const action = actions[index];
  return {
    index,
    fieldId: `customer-action-destination-${index}`,
    message: `${String(action.label || `Action button ${index + 1}`).trim()} needs a destination. Enter its email address, phone number, booking form, menu, product, payment, or order link.`
  };
}

export function enforceFreePublishingLimits(site = {}) {
  return {
    ...site,
    plan: 'free',
    extraPages: 0,
    pages: normalizeSelectedPagesForPlan(site.pages, 'free', 0),
    heroImage: '',
    heroMediaLink: '',
    media: []
  };
}
