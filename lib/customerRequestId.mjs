import { randomBytes } from 'node:crypto';

export function createCustomerRequestId(prefix, now = Date.now()) {
  const safePrefix = String(prefix || 'REQ').replace(/[^A-Z0-9-]/gi, '').toUpperCase().slice(0, 12) || 'REQ';
  const timestamp = Number(now).toString(36).toUpperCase();
  const nonce = randomBytes(4).toString('hex').toUpperCase();
  return `${safePrefix}-${timestamp}-${nonce}`;
}
