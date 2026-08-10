import { createHash } from 'crypto';
import { safeCustomerReturnPath } from './commerceConfig.mjs';

export const CHECKOUT_CONTINUATION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function checkoutContinuationKey(email = '') {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized ? createHash('sha256').update(normalized).digest('hex') : '';
}

export function checkoutContinuationRecord(email = '', returnPath = '', now = Date.now()) {
  const emailHash = checkoutContinuationKey(email);
  const safePath = safeCustomerReturnPath(returnPath);
  if (!emailHash || safePath === '/customer') return null;
  return {
    email_hash: emailHash,
    return_path: safePath,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + CHECKOUT_CONTINUATION_MAX_AGE_MS).toISOString()
  };
}

export function validCheckoutContinuation(row = {}, now = Date.now()) {
  const safePath = safeCustomerReturnPath(row.return_path);
  const expiresAt = Date.parse(row.expires_at || '');
  return safePath !== '/customer' && Number.isFinite(expiresAt) && expiresAt > now
    ? safePath
    : '/customer';
}
