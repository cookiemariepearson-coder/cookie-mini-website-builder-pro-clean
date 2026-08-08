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

export function builderCheckoutReturnPath(plan = '') {
  const key = String(plan || '').toLowerCase();
  return WEBSITE_CHECKOUTS[key] ? `/builder?checkout=${key}` : '/builder';
}

export function safeCustomerReturnPath(value = '') {
  const path = String(value || '').trim();
  if (path === '/builder' || path === '/customer') return path;
  if (/^\/builder\?checkout=(starter|business|premium|extra)$/.test(path)) return path;
  if (/^\/customer\/edit\/[a-z0-9-]+$/.test(path)) return path;
  return '/customer';
}
