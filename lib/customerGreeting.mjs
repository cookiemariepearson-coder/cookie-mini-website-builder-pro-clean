import { normalizeOwnerEmail } from './adminAuth.mjs';

export function customerDisplayName(user = {}) {
  const metadataName = String(
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    ''
  ).replace(/[<>]/g, '').trim().slice(0, 80);

  if (metadataName) return metadataName;

  const email = normalizeOwnerEmail(user?.email);
  if (!email) return 'there';
  if (email === 'cookiemariepearson@gmail.com') return 'Cookie';

  const localPart = email.split('@')[0] || '';
  const firstToken = localPart.split(/[._+-]/).find(Boolean) || '';
  if (!firstToken) return 'there';
  return firstToken.charAt(0).toUpperCase() + firstToken.slice(1);
}
