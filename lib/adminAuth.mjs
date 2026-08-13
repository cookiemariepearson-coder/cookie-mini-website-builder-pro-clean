import { normalizeBuilderCheckoutAuthToken } from './builderCheckoutAuth.mjs';

const ADMIN_ORIGIN = 'https://owner.cookiesdigitalcreations.invalid';
export const CANONICAL_ADMIN_EMAIL = 'hello@cookiesdigitalcreations.com';

export function normalizeOwnerEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function isCanonicalOwnerEmail(value = '') {
  return normalizeOwnerEmail(value) === CANONICAL_ADMIN_EMAIL;
}

function configuredEmails(value = '') {
  return String(value || '')
    .split(',')
    .map(normalizeOwnerEmail)
    .filter(Boolean);
}

export function legacyOwnerEnvironmentSummary(environment = process.env) {
  const plural = configuredEmails(environment.ADMIN_EMAILS);
  const singular = configuredEmails(environment.ADMIN_EMAIL);
  const entries = [...plural, ...singular];
  return {
    adminEmailsConfigured: plural.length > 0,
    adminEmailConfigured: singular.length > 0,
    legacyEntryCount: entries.length,
    legacyCanonicalEntryCount: entries.filter(isCanonicalOwnerEmail).length,
    legacyNonCanonicalEntryCount: entries.filter((email) => !isCanonicalOwnerEmail(email)).length,
    effectiveOwnerCount: 1
  };
}

export function safeAdminReturnPath(value = '/admin') {
  const raw = String(value || '').trim();
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/admin';

  try {
    const url = new URL(raw, ADMIN_ORIGIN);
    const adminPath = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
    const authPath = url.pathname === '/admin/auth' || url.pathname.startsWith('/admin/auth/');
    if (url.origin !== ADMIN_ORIGIN || !adminPath || authPath) return '/admin';
    return `${url.pathname}${url.search}`;
  } catch {
    return '/admin';
  }
}

export function ownerPasswordRecoveryUrl({ origin = '', returnPath = '/admin', tokenHash = '', type = 'recovery' } = {}) {
  const token = normalizeBuilderCheckoutAuthToken(tokenHash);
  if (!token || String(type || '').trim().toLowerCase() !== 'recovery') return '';

  const url = new URL('/admin/auth/password', origin);
  url.searchParams.set('return', safeAdminReturnPath(returnPath));
  url.hash = new URLSearchParams({ token_hash: token, type: 'recovery' }).toString();
  return url.toString();
}
