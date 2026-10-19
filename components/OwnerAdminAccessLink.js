'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OWNER_DASHBOARD_LOCKED_EVENT, checkOwnerDashboardSession } from '../lib/ownerDashboardSession.mjs';

export default function OwnerAdminAccessLink() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const session = await checkOwnerDashboardSession();
        if (active) setAuthorized(Boolean(session.authorized));
      } catch {
        if (active) setAuthorized(false);
      }
    }
    function hideForLockedSession() { setAuthorized(false); }
    refresh();
    window.addEventListener(OWNER_DASHBOARD_LOCKED_EVENT, hideForLockedSession);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener(OWNER_DASHBOARD_LOCKED_EVENT, hideForLockedSession);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  if (!authorized) return null;
  return <Link className="mainAdminAccessLink" href="/admin" aria-label="Open the Mini Website Builder admin dashboard">Admin Access</Link>;
}
