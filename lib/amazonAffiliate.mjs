export const DEFAULT_AMAZON_AFFILIATE_URL = 'https://amzn.to/3VTO2he';

const ALLOWED_HOSTS = new Set(['amzn.to', 'amazon.com']);

export function normalizeAmazonAffiliateUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw || raw.length > 2048) return '';

  let url;
  try {
    url = new URL(raw);
  } catch {
    return '';
  }

  if (url.protocol !== 'https:' || url.username || url.password) return '';
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const isAmazonHost = ALLOWED_HOSTS.has(host) || host.endsWith('.amazon.com');
  if (!isAmazonHost) return '';

  return url.toString();
}
