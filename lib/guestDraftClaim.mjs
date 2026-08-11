import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const GUEST_DRAFT_CLAIM_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;

export function normalizeGuestDraftClaimId(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return UUID_PATTERN.test(id) ? id : '';
}

export function normalizeGuestDraftClaimSecret(value = '') {
  const secret = String(value || '').trim();
  return SECRET_PATTERN.test(secret) ? secret : '';
}

export function newGuestDraftClaimSecret() {
  return randomBytes(32).toString('base64url');
}

export function guestDraftClaimSecretHash(secret = '') {
  const normalized = normalizeGuestDraftClaimSecret(secret);
  return normalized ? createHash('sha256').update(normalized).digest('hex') : '';
}

export function guestDraftClaimSecretMatches(secret = '', expectedHash = '') {
  const actualHash = guestDraftClaimSecretHash(secret);
  const expected = String(expectedHash || '').trim().toLowerCase();
  if (!actualHash || !/^[a-f0-9]{64}$/.test(expected)) return false;
  return timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expected, 'hex'));
}

export function guestDraftClaimState(row = {}, now = Date.now()) {
  const status = String(row.status || '').toLowerCase();
  const expiresAt = Date.parse(row.expires_at || '');
  if (!row.id || !['pending', 'claiming', 'claimed'].includes(status)) return { ok: false, reason: 'invalid' };
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return { ok: false, reason: 'expired' };
  return { ok: status === 'pending', status, reason: status === 'claimed' ? 'claimed' : status === 'claiming' ? 'claiming' : '' };
}

