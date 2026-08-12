import { getSupabaseAdmin } from './supabaseAdmin';
export { siteBelongsToEmail, siteBelongsToOwner } from './siteOwnership.mjs';

export const SITE_OWNER_SESSION_COOKIE = process.env.NODE_ENV === 'production'
  ? '__Host-cookieBuilderSession'
  : 'cookieBuilderSession';

export function siteOwnerSessionCookieOptions(maxAge = 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(60, Math.min(Number(maxAge) || 3600, 7 * 24 * 60 * 60))
  };
}

export function ownerEmail(user = {}) {
  return String(user.email || '').trim().toLowerCase();
}

export async function getVerifiedSiteOwner(req) {
  const authorization = String(req.headers.get('authorization') || '');
  const bearerToken = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
  const token = bearerToken || req.cookies.get(SITE_OWNER_SESSION_COOKIE)?.value || '';

  if (!token) {
    return { ok: false, status: 401, error: 'Sign in to manage saved websites.' };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  const email = ownerEmail(data?.user);

  if (error || !data?.user || !email) {
    return { ok: false, status: 401, error: 'Your secure sign-in expired. Sign in again from the account menu.' };
  }

  return { ok: true, user: data.user, email, supabase, token, migratedBearer: Boolean(bearerToken && !req.cookies.get(SITE_OWNER_SESSION_COOKIE)?.value) };
}

export const ADMIN_SESSION_COOKIE = 'cookieAdminSession';

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'hello@cookiesdigitalcreations.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email = '') {
  return adminEmails().includes(String(email).trim().toLowerCase());
}

export async function getVerifiedAdmin(req) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  if (!token) return { ok: false, status: 401, error: 'Owner sign-in required.' };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  const email = ownerEmail(data?.user);
  if (error || !data?.user || !email) {
    return { ok: false, status: 401, error: 'Your owner session expired. Request a new secure email link.' };
  }
  if (!isAllowedAdminEmail(email)) {
    return { ok: false, status: 403, error: 'This email is not authorized for owner access.' };
  }
  return { ok: true, user: data.user, email, supabase };
}
