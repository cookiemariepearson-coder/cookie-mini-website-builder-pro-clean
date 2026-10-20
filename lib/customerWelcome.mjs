import { normalizeOwnerEmail } from './adminAuth.mjs';

export function customerWelcomeName(displayName = '', email = '') {
  const normalizedEmail = normalizeOwnerEmail(email);
  if (normalizedEmail === 'cookiemariepearson@gmail.com') return 'Cookie';

  const savedName = String(displayName || '').trim();
  if (savedName) {
    const firstName = savedName.split(/\s+/)[0].replace(/[<>]/g, '').slice(0, 40);
    if (firstName) return firstName;
  }

  const localPart = normalizedEmail.split('@')[0] || '';
  const firstToken = localPart.split(/[._-]+/).filter(Boolean)[0] || 'there';
  return firstToken.charAt(0).toUpperCase() + firstToken.slice(1);
}
