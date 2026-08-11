import { normalizeWebsiteCheckoutIntentId } from './websiteCheckoutIntent.mjs';
import { safeCustomerReturnPath } from './commerceConfig.mjs';

const TOKEN_HASH_PATTERN = /^[A-Za-z0-9._~+/=-]{20,1024}$/;

export function canonicalBuilderOrigin(requestUrl, rootDomain = 'cookiesdigitalcreations.com') {
  const parsed = requestUrl instanceof URL ? requestUrl : new URL(String(requestUrl || ''));
  const root = String(rootDomain || 'cookiesdigitalcreations.com').trim().toLowerCase();
  if (parsed.hostname === root || parsed.hostname === `www.${root}`) return `https://www.${root}`;
  return parsed.origin;
}

export function normalizeBuilderCheckoutAuthToken(value = '') {
  const tokenHash = String(value || '').trim();
  return TOKEN_HASH_PATTERN.test(tokenHash) ? tokenHash : '';
}

export function normalizeBuilderCheckoutAuthType(value = '') {
  return String(value || '').trim().toLowerCase() === 'magiclink' ? 'magiclink' : '';
}

export function normalizeBuilderCustomerAuthMode(value = '') {
  return String(value || '').trim().toLowerCase() === 'create' ? 'create' : 'signin';
}

export function builderCheckoutConfirmationUrl({ origin = '', intentId = '', tokenHash = '', type = 'magiclink' } = {}) {
  const id = normalizeWebsiteCheckoutIntentId(intentId);
  const token = normalizeBuilderCheckoutAuthToken(tokenHash);
  const verificationType = normalizeBuilderCheckoutAuthType(type);
  if (!id || !token || !verificationType) return '';

  const url = new URL('/customer/auth/confirm', origin);
  url.searchParams.set('intent', id);
  url.hash = new URLSearchParams({ token_hash: token, type: verificationType }).toString();
  return url.toString();
}

export function builderCustomerConfirmationUrl({ origin = '', returnPath = '/customer', tokenHash = '', type = 'magiclink', authMode = 'signin' } = {}) {
  const token = normalizeBuilderCheckoutAuthToken(tokenHash);
  const verificationType = normalizeBuilderCheckoutAuthType(type);
  if (!token || !verificationType) return '';

  const url = new URL('/customer/auth/confirm', origin);
  url.searchParams.set('return', safeCustomerReturnPath(returnPath));
  url.searchParams.set('mode', normalizeBuilderCustomerAuthMode(authMode));
  url.hash = new URLSearchParams({ token_hash: token, type: verificationType }).toString();
  return url.toString();
}
