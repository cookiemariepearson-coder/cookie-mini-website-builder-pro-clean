'use client';

import { useState } from 'react';
import { useAccountModal } from './AccountModalProvider';
import { CANONICAL_ADMIN_EMAIL, normalizeOwnerEmail } from '../lib/adminAuth.mjs';

export default function OwnerAdminReturnLink() {
  const { accountState, accountEmail } = useAccountModal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isCanonicalOwner = accountState === 'signed-in' && normalizeOwnerEmail(accountEmail) === CANONICAL_ADMIN_EMAIL;

  async function openAdminAccess() {
    if (!isCanonicalOwner || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/admin/customer-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: '{}'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Admin Access could not be opened.');
      window.location.assign('/admin');
    } catch (requestError) {
      setError(requestError?.message || 'Admin Access could not be opened. Please sign in again.');
      setBusy(false);
    }
  }

  if (!isCanonicalOwner) return null;
  return (
    <span className="ownerAdminEntry">
      <button
        className="mainAdminAccessLink"
        type="button"
        onClick={openAdminAccess}
        disabled={busy}
        aria-label="Open owner-only Admin Access"
      >
        {busy ? 'Opening Admin…' : 'Admin Access'}
      </button>
      {error && <span className="ownerAdminEntryError" role="alert">{error}</span>}
    </span>
  );
}
