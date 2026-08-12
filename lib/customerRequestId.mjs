import { randomBytes } from 'node:crypto';

export function createCustomerRequestId(prefix, now = Date.now()) {
  const safePrefix = String(prefix || 'REQ').replace(/[^A-Z0-9-]/gi, '').toUpperCase().slice(0, 12) || 'REQ';
  const timestamp = Number(now).toString(36).toUpperCase();
  const nonce = randomBytes(4).toString('hex').toUpperCase();
  return `${safePrefix}-${timestamp}-${nonce}`;
}

export function customerRequestIdFromSubmission(prefix, submissionId = '') {
  const normalized = String(submissionId || '').trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) return '';
  const safePrefix = String(prefix || 'REQ').replace(/[^A-Z0-9-]/gi, '').toUpperCase().slice(0, 12) || 'REQ';
  return `${safePrefix}-${normalized.replace(/-/g, '').toUpperCase()}`;
}
