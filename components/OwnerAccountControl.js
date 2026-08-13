'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OWNER_DASHBOARD_LOCKED_EVENT,
  checkOwnerDashboardSession,
  lockOwnerDashboard
} from '../lib/ownerDashboardSession.mjs';

export default function OwnerAccountControl() {
  const [sessionState, setSessionState] = useState('checking');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const controlRef = useRef(null);
  const buttonRef = useRef(null);
  const firstItemRef = useRef(null);

  const refreshSession = useCallback(async () => {
    try {
      const status = await checkOwnerDashboardSession();
      setSessionState(status.authorized ? 'unlocked' : 'locked');
    } catch {
      setSessionState('locked');
    }
  }, []);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  useEffect(() => {
    function handleLocked() {
      setSessionState('locked');
      setOpen(false);
    }
    window.addEventListener(OWNER_DASHBOARD_LOCKED_EVENT, handleLocked);
    return () => window.removeEventListener(OWNER_DASHBOARD_LOCKED_EVENT, handleLocked);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event) {
      if (!controlRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    window.setTimeout(() => firstItemRef.current?.focus(), 0);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function closeAndRestoreFocus() {
    setOpen(false);
    window.setTimeout(() => buttonRef.current?.focus(), 0);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  }

  async function handleLock() {
    setError('');
    setSessionState('locking');
    setOpen(false);
    try {
      await lockOwnerDashboard();
    } catch (lockError) {
      setSessionState('unlocked');
      setError(lockError?.message || 'The owner dashboard could not be locked. Try again.');
      setOpen(true);
    }
  }

  const unlocked = sessionState === 'unlocked' || sessionState === 'locking';
  const statusLabel = sessionState === 'checking'
    ? 'Checking secure owner session'
    : unlocked
      ? 'Owner dashboard unlocked'
      : 'Owner dashboard locked';

  return <div className="ownerAccountControl" ref={controlRef} onKeyDown={handleKeyDown}>
    <button
      ref={buttonRef}
      className="navAccountLink ownerAccountButton"
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls="owner-account-menu"
      aria-label={`Owner Account — ${statusLabel}`}
      onClick={() => setOpen(value => !value)}
    >
      Owner Account
    </button>
    {open && <div id="owner-account-menu" className="navAccountMenuPanel ownerAccountMenuPanel" role="menu" aria-label="Owner account actions">
      <p className="ownerAccountStatus" role="status">{statusLabel}</p>
      <Link ref={firstItemRef} role="menuitem" href="/admin">Owner Dashboard</Link>
      {unlocked
        ? <button role="menuitem" type="button" onClick={handleLock} disabled={sessionState === 'locking'}>{sessionState === 'locking' ? 'Locking Owner Dashboard…' : 'Lock Owner Dashboard'}</button>
        : <Link role="menuitem" href="/admin">Open Owner Sign-In</Link>}
      <Link role="menuitem" href="/">Return to Main Website</Link>
      {error && <p className="ownerAccountError" role="alert">{error}</p>}
    </div>}
  </div>;
}
