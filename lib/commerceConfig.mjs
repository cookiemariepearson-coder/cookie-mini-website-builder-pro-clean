export const WEBSITE_CHECKOUTS = Object.freeze({
  starter: Object.freeze({ route: '/checkout/starter', envName: 'NEXT_PUBLIC_STARTER_SUBSCRIPTION_CHECKOUT_URL' }),
  business: Object.freeze({ route: '/checkout/business', envName: 'NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL' }),
  premium: Object.freeze({ route: '/checkout/premium', envName: 'NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL' }),
  extra: Object.freeze({ route: '/checkout/extra', envName: 'NEXT_PUBLIC_EXTRA_PAGE_SUBSCRIPTION_CHECKOUT_URL' })
});

export const DFY_CHECKOUT_ENV_BY_SERVICE = Object.freeze({
  'Free Launch Page': 'DFY_FREE_LAUNCH_CHECKOUT_URL',
  'Starter Pro': 'DFY_STARTER_CHECKOUT_URL',
  Business: 'DFY_BUSINESS_CHECKOUT_URL',
  Premium: 'DFY_PREMIUM_CHECKOUT_URL',
  'Extra Page Add-On': 'DFY_EXTRA_PAGE_CHECKOUT_URL'
});

export const AI_VIDEO_CHECKOUT = Object.freeze({
  route: '/checkout/ai-video',
  envName: 'NEXT_PUBLIC_AI_VIDEO_CHECKOUT_URL',
  productIdEnvName: 'GUMROAD_AI_VIDEO_PRODUCT_ID'
});

export const PENDING_CHECKOUT_STORAGE_KEY = 'cookiePendingWebsiteCheckout';
export const PENDING_CHECKOUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function cleanDraftSlug(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
}

export function createPendingCheckoutIntent(plan = '', draft = '', now = Date.now()) {
  const key = String(plan || '').toLowerCase();
  if (!WEBSITE_CHECKOUTS[key]) return null;
  return { plan: key, draft: cleanDraftSlug(draft), createdAt: Number(now) };
}

export function parsePendingCheckoutIntent(value, now = Date.now()) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const intent = createPendingCheckoutIntent(parsed?.plan, parsed?.draft, parsed?.createdAt);
    if (!intent || !Number.isFinite(intent.createdAt)) return null;
    if (intent.createdAt > now + 60_000 || now - intent.createdAt > PENDING_CHECKOUT_MAX_AGE_MS) return null;
    return intent;
  } catch {
    return null;
  }
}

export function cleanCheckoutUrl(raw) {
  if (!raw) return '';
  let url = String(raw).trim().replace(/^["']+|["']+$/g, '').trim();
  if (!url) return '';

  if (/^https?%3A%2F%2F/i.test(url)) {
    try { url = decodeURIComponent(url); } catch {}
  }
  if (url.startsWith('//')) url = `https:${url}`;
  if (/^((www\.)?gumroad\.com|[a-z0-9-]+\.gumroad\.com)\//i.test(url)) url = `https://${url}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(url) && !url.startsWith('http')) url = `https://${url}`;

  url = url.replace(/^https?:\/\/(www\.)?cookiesdigitalcreations\.com\/(https?:\/\/)?/i, 'https://');
  url = url.replace(/^https?:\/\/(www\.)?cookiesdigitalcreations\.com\/(cookiepearson\.gumroad\.com\/)/i, 'https://$2');

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

export function websiteCheckoutRoute(plan = '') {
  return WEBSITE_CHECKOUTS[String(plan || '').toLowerCase()]?.route || '';
}

export function builderCheckoutReturnPath(plan = '', draft = '') {
  const key = String(plan || '').toLowerCase();
  if (!WEBSITE_CHECKOUTS[key]) return '/builder';
  const slug = cleanDraftSlug(draft);
  return `/builder?checkout=${key}${slug ? `&draft=${encodeURIComponent(slug)}` : ''}`;
}

export function pendingCheckoutReturnPath(value, now = Date.now()) {
  const intent = parsePendingCheckoutIntent(value, now);
  return intent ? builderCheckoutReturnPath(intent.plan, intent.draft) : '/customer';
}

export function resolveCustomerContinuation(explicitPath = '', pendingValue = '', now = Date.now()) {
  const safeExplicit = safeCustomerReturnPath(explicitPath);
  return safeExplicit !== '/customer' ? safeExplicit : pendingCheckoutReturnPath(pendingValue, now);
}

export function safeCustomerReturnPath(value = '') {
  const path = String(value || '').trim();
  if (path === '/builder' || path === '/customer') return path;
  try {
    const parsed = new URL(path, 'https://customer-return.invalid');
    if (parsed.origin !== 'https://customer-return.invalid') return '/customer';
    if (parsed.pathname === '/builder') {
      const plan = parsed.searchParams.get('checkout') || '';
      const draft = parsed.searchParams.get('draft') || '';
      if (websiteCheckoutRoute(plan) && [...parsed.searchParams.keys()].every(key => key === 'checkout' || key === 'draft')) {
        return builderCheckoutReturnPath(plan, draft);
      }
    }
    if (parsed.pathname === '/checkout/continue') {
      const intent = parsed.searchParams.get('intent') || '';
      const draft = cleanDraftSlug(parsed.searchParams.get('draft') || '');
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(intent) && [...parsed.searchParams.keys()].every(key => key === 'intent' || key === 'draft')) {
        return `/checkout/continue?intent=${encodeURIComponent(intent)}${draft ? `&draft=${encodeURIComponent(draft)}` : ''}`;
      }
    }
  } catch {}
  if (path === '/video-studio') return path;
  if (/^\/customer\/edit\/[a-z0-9-]+$/.test(path)) return path;
  return '/customer';
}

export function customerReturnPath(returnTarget = '', checkoutPlan = '', draft = '') {
  if (returnTarget === 'builder') return builderCheckoutReturnPath(checkoutPlan, draft);
  if (returnTarget === 'video-studio') return '/video-studio';
  return '/customer';
}
