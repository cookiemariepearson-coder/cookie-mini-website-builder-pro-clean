const clean = (value = '') => String(value || '').trim();

export const APPROVED_WEBSITE_PRODUCTS = Object.freeze({
  starter: Object.freeze({
    plan: 'starter',
    productId: 'MkDLUO7f0FrvtcJ9rKOeiA==',
    permalink: 'cookie-website-starter',
    name: 'Cookie Mini Website Builder — Starter Subscription $19/month'
  }),
  business: Object.freeze({
    plan: 'business',
    productId: 'RxLLDsLsLaQb1n6letAgSQ==',
    permalink: 'cookie-website-business',
    name: 'Cookie Mini Website Builder — Business Subscription $30/month'
  }),
  premium: Object.freeze({
    plan: 'premium',
    productId: 'nIhF20oiaNRhLzSJOS7tWw==',
    permalink: 'cookie-website-premium',
    name: 'Cookie Mini Website Builder — Premium Subscription $50/month'
  }),
  extra: Object.freeze({
    plan: 'extra_page',
    productId: '',
    permalink: 'extrapageadd-on',
    shortProductId: 'zydzyq',
    name: 'Cookie Mini Website Builder — Extra Page Add-On $10/month per extra page'
  })
});

function permalinkFrom(value = '') {
  const raw = clean(value).toLowerCase();
  if (!raw) return '';
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://gumroad.invalid/l/${raw}`);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts.at(-1) || '';
  } catch {
    return raw.replace(/^.*\/l\//, '').split(/[?#/]/)[0];
  }
}

export function identifyWebsiteProduct(payload = {}) {
  const productId = clean(payload.product_id);
  const permalink = permalinkFrom(payload.permalink || payload.product_permalink);
  const shortProductId = clean(payload.short_product_id).toLowerCase();

  for (const [key, product] of Object.entries(APPROVED_WEBSITE_PRODUCTS)) {
    if (product.productId && productId === product.productId) {
      if (permalink && permalink !== product.permalink) return null;
      return { key, ...product };
    }
    if (!product.productId && permalink === product.permalink) {
      if (product.shortProductId && shortProductId && shortProductId !== product.shortProductId) return null;
      return { key, ...product };
    }
  }
  return null;
}

export function sanitizeGumroadPayload(payload = {}) {
  const safe = {};
  const allowed = new Set([
    'resource_name', 'resource', 'event', 'sale_id', 'order_number', 'subscription_id',
    'product_id', 'product_name', 'product_permalink', 'permalink', 'short_product_id',
    'quantity', 'currency', 'price', 'refunded', 'disputed', 'dispute_won', 'test',
    'sale_timestamp'
  ]);
  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = key.toLowerCase();
    const isWebsiteField = normalizedKey.includes('website') || normalizedKey.includes('subdomain');
    if (allowed.has(key) || isWebsiteField) safe[key] = value;
  }
  return safe;
}
