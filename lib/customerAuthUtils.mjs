import { ownerEmail } from './siteOwnerAuth.js';

export function siteOwnerAccessToken(req) {
  const authorization = String(req.headers.get('authorization') || '');
  return authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
}

export async function siteOwnerAccountExists(supabase, email = '') {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return false;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if ((data?.users || []).some((user) => ownerEmail(user) === target)) return true;
    if ((data?.users || []).length < 1000) return false;
  }

  return false;
}
