import {
  AI_VIDEO_CHECKOUT,
  DFY_CHECKOUT_ENV_BY_SERVICE,
  WEBSITE_CHECKOUTS,
  cleanCheckoutUrl
} from './commerceConfig.mjs';

export const DFY_SERVICE_CATALOG = Object.freeze({
  'Free Launch Page': Object.freeze({ setupPrice: '$99 one-time setup', purchaseType: 'one-time setup' }),
  'Starter Pro': Object.freeze({ setupPrice: '$249 one-time setup', purchaseType: 'one-time setup' }),
  Business: Object.freeze({ setupPrice: '$499 one-time setup', purchaseType: 'one-time setup' }),
  Premium: Object.freeze({ setupPrice: '$899 one-time setup', purchaseType: 'one-time setup' }),
  'Extra Page Add-On': Object.freeze({ setupPrice: '$125 one-time setup', purchaseType: 'one-time setup add-on' })
});

function canonicalGumroadUrl(raw = '') {
  const cleaned = cleanCheckoutUrl(raw);
  if (!cleaned) return '';
  try {
    const url = new URL(cleaned);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || (host !== 'gumroad.com' && !host.endsWith('.gumroad.com'))) return '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function gumroadProductKey(raw = '') {
  const canonical = canonicalGumroadUrl(raw);
  if (!canonical) return '';
  const url = new URL(canonical);
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const checkoutProduct = path === '/checkout' ? String(url.searchParams.get('product') || '').trim() : '';
  return checkoutProduct ? `checkout:${checkoutProduct}` : `${host}${path}`;
}

function protectedNonDfyTargets(environment = {}) {
  return [
    ...Object.values(WEBSITE_CHECKOUTS).map((item) => environment[item.envName]),
    environment[AI_VIDEO_CHECKOUT.envName]
  ].map(gumroadProductKey).filter(Boolean);
}

export function resolveDfyCheckout(service = '', environment = {}) {
  const envName = DFY_CHECKOUT_ENV_BY_SERVICE[service] || '';
  const catalog = DFY_SERVICE_CATALOG[service] || null;
  if (!envName || !catalog) return { service, envName, configured: false, url: '', reason: 'unknown-service' };

  const raw = String(environment[envName] || '').trim();
  if (!raw) return { service, envName, ...catalog, configured: false, url: '', reason: 'missing' };

  const url = canonicalGumroadUrl(raw);
  if (!url) return { service, envName, ...catalog, configured: false, url: '', reason: 'invalid-gumroad-url' };

  const productKey = gumroadProductKey(url);
  if (protectedNonDfyTargets(environment).includes(productKey)) {
    return { service, envName, ...catalog, configured: false, url: '', reason: 'subscription-or-ai-video-conflict' };
  }

  const duplicate = Object.entries(DFY_CHECKOUT_ENV_BY_SERVICE).find(([otherService, otherEnvName]) => (
    otherService !== service && gumroadProductKey(environment[otherEnvName]) === productKey
  ));
  if (duplicate) {
    return { service, envName, ...catalog, configured: false, url: '', reason: 'duplicate-dfy-product', conflictsWith: duplicate[0] };
  }

  return { service, envName, ...catalog, configured: true, url, reason: 'configured' };
}

export function getDfyCheckoutConfiguration(environment = {}) {
  return Object.keys(DFY_SERVICE_CATALOG).map((service) => resolveDfyCheckout(service, environment));
}
