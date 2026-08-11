'use client';

import Link from 'next/link';
import { useAccountModal } from './AccountModalProvider';

export default function CustomerAccountLink({ placement = 'nav' }) {
  const { accountState, openAccountModal, signOut } = useAccountModal();
  const signedIn = accountState === 'signed-in';
  const checking = accountState === 'checking';

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
    return <details className="navAccountMenu">
      <summary className="navAccountLink">Account</summary>
      <div className="navAccountMenuPanel">
        <Link href="/customer">My Websites</Link>
        <Link href="/customer/account">Account Settings</Link>
        <button type="button" onClick={signOut}>Sign Out</button>
      </div>
    </details>;
  }

  return <span className="navAccountControl" data-account-state={accountState}>
    <button className="navAccountLink" type="button" onClick={() => openAccountModal({ mode: 'signin', destination: '/customer' })} aria-label="Open Mini Website Builder customer account">Customer Account</button>
    {checking && <span className="navAccountChecking" aria-hidden="true">Checking…</span>}
  </span>;
}
