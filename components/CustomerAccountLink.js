'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAccountModal } from './AccountModalProvider';

export default function CustomerAccountLink({ placement = 'nav' }) {
  const { accountState, openAccountModal, signOut } = useAccountModal();
  const [open, setOpen] = useState(false);
  const controlRef = useRef(null);
  const buttonRef = useRef(null);
  const firstItemRef = useRef(null);
  const signedIn = accountState === 'signed-in';
  const checking = accountState === 'checking';

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event) {
      if (!controlRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    window.setTimeout(() => firstItemRef.current?.focus(), 0);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpen(false);
    window.setTimeout(() => buttonRef.current?.focus(), 0);
  }

  if (placement === 'hero') {
    return <div className="returningCustomerAccess" data-account-state={accountState}>
      {signedIn ? <>
        <Link className="btn light customerAccountHeroLink" href="/customer" aria-label="My Websites — open your saved drafts and published websites">My Websites</Link>
        <span className="returningCustomerPrompt">Welcome back. Open your drafts and purchased websites.</span>
      </> : <>
        <button className="btn light customerAccountHeroLink" type="button" onClick={() => openAccountModal({ mode: 'signin', destination: '/customer' })} aria-label="Customer Sign In — open saved Mini Website Builder websites">Customer Sign In</button>
        <span className="returningCustomerPrompt">Already started a website? Sign in to open your drafts.</span>
      </>}
      {checking && <span className="returningCustomerPrompt" role="status">Checking your secure account…</span>}
    </div>;
  }

  if (signedIn) {
    return <div className={`navAccountMenu ${placement === 'builder' ? 'builderAccountControl' : ''}`} ref={controlRef} onKeyDown={handleKeyDown}>
      <button ref={buttonRef} className="navAccountLink" type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={`${placement}-account-menu`} onClick={() => setOpen(value => !value)}>Account</button>
      {open && <div id={`${placement}-account-menu`} className="navAccountMenuPanel" role="menu" aria-label="Customer account actions">
        <Link ref={firstItemRef} role="menuitem" href="/customer">My Websites</Link>
        <Link role="menuitem" href="/customer/account">Account Settings</Link>
        <button role="menuitem" type="button" onClick={signOut}>Sign Out</button>
      </div>
      }
    </div>;
  }

  return <span className="navAccountControl" data-account-state={accountState}>
    <button className="navAccountLink" type="button" onClick={() => openAccountModal({ mode: 'signin', destination: '/customer' })} aria-label="Open Mini Website Builder customer account">Customer Account</button>
    {checking && <span className="navAccountChecking" aria-hidden="true">Checking…</span>}
  </span>;
}
