'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccountModal } from './AccountModalProvider';
import {
  OWNER_DASHBOARD_LOCKED_EVENT,
  checkOwnerDashboardSession
} from '../lib/ownerDashboardSession.mjs';

const CANONICAL_OWNER_EMAIL = 'cookiemariepearson@gmail.com';

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

export default function OwnerAdminReturnLink() {
  const { accountState, accountEmail } = useAccountModal();
  const [verifiedOwnerSession, setVerifiedOwnerSession] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      // A signed-in customer controls the nav state. Never display the owner shortcut
      // for another customer, even if an owner cookie remains in the same browser.
      if (accountState !== 'signed-out') {
        if (active) setVerifiedOwnerSession(false);
        return;
      }

      try {
        const status = await checkOwnerDashboardSession();
        const email = normalizeEmail(status?.result?.email);
        if (active) {
          setVerifiedOwnerSession(Boolean(status?.authorized && email === CANONICAL_OWNER_EMAIL));
        }
      } catch {
        if (active) setVerifiedOwnerSession(false);
      }
    }

    function handleLocked() { setVerifiedOwnerSession(false); }
    refresh();
    window.addEventListener(OWNER_DASHBOARD_LOCKED_EVENT, handleLocked);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener(OWNER_DASHBOARD_LOCKED_EVENT, handleLocked);
      window.removeEventListener('focus', refresh);
    };
  }, [accountState]);

  const customerIsOwner = accountState === 'signed-in'
    && normalizeEmail(accountEmail) === CANONICAL_OWNER_EMAIL;
  const showAdminAccess = customerIsOwner || (accountState === 'signed-out' && verifiedOwnerSession);

  if (!showAdminAccess) return null;
  return <Link className="mainAdminAccessLink" href="/admin" aria-label="Open Mini Website Builder admin access">Admin Access</Link>;
}
