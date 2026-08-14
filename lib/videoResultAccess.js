import crypto from 'crypto';

export function normalizeVideoEmail(value = '') {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function videoEmailHash(value = '') {
  const email = normalizeVideoEmail(value);
  return email ? crypto.createHash('sha256').update(email).digest('hex') : '';
}

export function normalizeVideoSlug(value = '') {
  let input = String(value || '').trim().toLowerCase();
  input = input.replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (input.includes('/site/')) input = input.split('/site/')[1] || input;
  input = input.split(/[/?#]/)[0] || '';
  const root = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').toLowerCase();
  if (input.endsWith(`.${root}`)) input = input.slice(0, -1 * (`.${root}`).length);
  if (input === root) return '';
  return input.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function standaloneVideoSlug(saleId = '') {
  return saleId ? `standalone-${crypto.createHash('sha256').update(String(saleId)).digest('hex').slice(0, 24)}` : '';
}

export function standaloneVideoSlugFromAccess(access = {}) {
  const namespace = String(access?.namespace || '');
  if (/^standalone-[a-f0-9]{24}$/.test(namespace)) return namespace;
  return standaloneVideoSlug(access?.saleId || '');
}

export function standaloneIdentityMatches(access = {}, email = '') {
  const normalized = normalizeVideoEmail(email);
  if (!normalized) return false;
  const expectedHash = String(access?.emailHash || '');
  if (expectedHash) return videoEmailHash(normalized) === expectedHash;
  return normalized === normalizeVideoEmail(access?.email);
}

export function videoJobBelongsToAccess(jobSlug = '', authorizedSlug = '') {
  return Boolean(jobSlug && authorizedSlug && String(jobSlug) === String(authorizedSlug));
}

export function filterAuthorizedVideoJobs(jobs = [], { access, authorized, requestedEmail = '' } = {}) {
  const rows = Array.isArray(jobs) ? jobs : [];
  if (!authorized?.ok || !authorized.slug) return [];
  const scoped = rows.filter(row => videoJobBelongsToAccess(row?.website_slug, authorized.slug));
  if (access?.kind !== 'standalone') return scoped;

  return authorized.ownerId && String(access?.ownerId || '') === String(authorized.ownerId) ? scoped : [];
}

export function authorizeVideoResultAccess({ access, owner = null, requestedEmail = '', requestedSlug = '', requireIdentity = false } = {}) {
  const email = normalizeVideoEmail(requestedEmail);
  const slug = normalizeVideoSlug(requestedSlug);
  if (!access) return { ok: false, status: 401 };

  if (access.kind === 'standalone') {
    const allowedSlug = standaloneVideoSlugFromAccess(access);
    const ownerId = String(owner?.user?.id || owner?.id || '');
    if (!allowedSlug || !ownerId || String(access.ownerId || '') !== ownerId) return { ok: false, status: 403 };
    return { ok: true, slug: allowedSlug, ownerId };
  }

  if (access.kind === 'website-plan') {
    const allowedSlug = normalizeVideoSlug(access.slug);
    const ownerId = String(owner?.user?.id || owner?.id || '');
    const ownerEmail = normalizeVideoEmail(owner?.email || owner?.user?.email);
    if (!allowedSlug || !ownerId || String(access.ownerId || '') !== ownerId) return { ok: false, status: 403 };
    if (requireIdentity && !email && !slug) return { ok: false, status: 403 };
    if (email && email !== ownerEmail) return { ok: false, status: 403 };
    if (slug && slug !== allowedSlug) return { ok: false, status: 403 };
    return { ok: true, slug: allowedSlug, email: ownerEmail };
  }

  return { ok: false, status: 403 };
}
