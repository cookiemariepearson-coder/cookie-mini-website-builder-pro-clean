'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  OWNER_DASHBOARD_LOCKED_EVENT,
  checkOwnerDashboardSession
} from '../lib/ownerDashboardSession.mjs';

// Render a dashboard shortcut only for a verified, active owner session.
export default function OwnerAdminReturnLink() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const status = await checkOwnerDashboardSession();
        if (active) setAuthorized(Boolean(status?.authorized));
      } catch {
        if (active) setAuthorized(false);
      }
    }
    function handleLocked() { setAuthorized(false); }
    refresh();
    window.addEventListener(OWNER_DASHBOARD_LOCKED_EVENT, handleLocked);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener(OWNER_DASHBOARD_LOCKED_EVENT, handleLocked);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  if (!authorized) return null;
  return <Link className="mainAdminAccessLink" href="/admin">Owner Dashboard</Link>;
}
