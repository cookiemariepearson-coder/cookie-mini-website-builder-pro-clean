import { getSupabaseAdmin } from './supabaseAdmin';

export function ownerEmail(user = {}) {
  return String(user.email || '').trim().toLowerCase();
}

export async function getVerifiedSiteOwner(req) {
  const authorization = String(req.headers.get('authorization') || '');
  const token = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (!token) {
    return { ok: false, status: 401, error: 'Verify your email to manage saved websites.' };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  const email = ownerEmail(data?.user);

  if (error || !data?.user || !email) {
    return { ok: false, status: 401, error: 'Your secure sign-in has expired. Request a new email link from My Website.' };
  }

  return { ok: true, user: data.user, email, supabase };
}

export function siteBelongsToEmail(row = {}, email = '') {
  const savedEmail = String(
    row.customer_email ||
    row.site?.customerEmail ||
    row.site?.email ||
    ''
  ).trim().toLowerCase();

  return Boolean(savedEmail && email && savedEmail === String(email).trim().toLowerCase());
}
