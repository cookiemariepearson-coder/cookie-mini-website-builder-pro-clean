'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  OWNER_DASHBOARD_LOCK_ERROR_EVENT,
  OWNER_DASHBOARD_LOCKING_EVENT,
  lockOwnerDashboard
} from '../lib/ownerDashboardSession.mjs';

export default function AdminSessionBoundary({ children }) {
  const [lockState, setLockState] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    function handleLocking() {
      setMessage('');
      setLockState('locking');
    }
    function handleLockError(event) {
      setMessage(event.detail?.message || 'The secure owner session could not be cleared.');
      setLockState('error');
    }
    function handlePageShow(event) {
      if (event.persisted) window.location.reload();
    }
    window.addEventListener(OWNER_DASHBOARD_LOCKING_EVENT, handleLocking);
    window.addEventListener(OWNER_DASHBOARD_LOCK_ERROR_EVENT, handleLockError);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener(OWNER_DASHBOARD_LOCKING_EVENT, handleLocking);
      window.removeEventListener(OWNER_DASHBOARD_LOCK_ERROR_EVENT, handleLockError);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  async function retryLock() {
    try { await lockOwnerDashboard(); } catch {}
  }

  if (lockState !== 'idle') {
    return <main className="wrap dashboard adminWarmPage ownerLockScreen">
      <section className="adminPanel" role="status" aria-live="polite">
        <span className="kicker">Owner only</span>
        <h1>{lockState === 'locking' ? 'Locking Owner Dashboard…' : 'Owner Dashboard Hidden'}</h1>
        <p>{lockState === 'locking' ? 'Protected owner records have been removed from this screen while the secure session is cleared.' : message}</p>
        {lockState === 'error' && <div className="navRow">
          <button className="btn dark" type="button" onClick={retryLock}>Try Lock Again</button>
          <Link className="btn light" href="/">Return to Main Website</Link>
        </div>}
      </section>
    </main>;
  }

  return children;
}
