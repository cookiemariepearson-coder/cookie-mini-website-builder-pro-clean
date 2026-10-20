export const DEFAULT_AMAZON_AFFILIATE_URL = 'https://amzn.to/3VTO2he';

export function normalizeAmazonAffiliateUrl(value = '') {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.toLowerCase();
    const allowed = host === 'amzn.to' || host === 'amazon.com' || host.endsWith('.amazon.com');
    if (url.protocol !== 'https:' || !allowed || !url.pathname || url.pathname === '/') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function safeAmazonAffiliateUrl(value = '') {
  return normalizeAmazonAffiliateUrl(value) || DEFAULT_AMAZON_AFFILIATE_URL;
}
