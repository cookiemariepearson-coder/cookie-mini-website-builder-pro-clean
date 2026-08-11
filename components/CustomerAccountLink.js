'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';

export default function CustomerAccountLink({ placement = 'nav' }) {
  const [accountState, setAccountState] = useState('signed-out');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    let token = '';
    try { token = window.localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch {}
    if (!token) return () => { active = false; };

    setAccountState('checking');
    setFeedback('Checking your secure customer session.');
    fetch('/api/auth/site-owner/session', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.json().then(data => ({ ok: response.ok && data.ok })))
      .then(result => {
        if (!active) return;
        if (result.ok) {
          setAccountState('signed-in');
          setFeedback('Secure customer session confirmed. My Websites is ready.');
          return;
        }
        try { window.localStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
        setAccountState('signed-out');
        setFeedback('Your previous session ended. Sign In and Create Free Account are available.');
      })
      .catch(() => {
        if (!active) return;
        setAccountState('error');
        setFeedback('We could not check your saved session. Secure account access is still available.');
      });

    return () => { active = false; };
  }, []);

  async function signOut() {
    let token = '';
    try { token = window.localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch {}
    setAccountState('checking');
    setFeedback('Signing out securely.');
    try {
      await fetch('/api/auth/site-owner/signout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    try { window.localStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
    setAccountState('signed-out');
    setFeedback('Signed out. Private websites require a new secure email link.');
    window.location.assign('/');
  }

  const signedIn = accountState === 'signed-in';
  const checking = accountState === 'checking';

  if (placement === 'hero') {
    return (
      <div className="returningCustomerAccess" data-account-state={accountState}>
        {signedIn ? (
          <>
            <Link className="btn light customerAccountHeroLink" href="/customer" aria-label="My Websites — open your saved drafts and published websites">My Websites</Link>
            <Link className="btn light customerAccountHeroLink" href="/customer/account">Account</Link>
            <span className="returningCustomerPrompt">Welcome back. Open your drafts and purchased websites.</span>
          </>
        ) : (
          <>
            <Link className="btn light customerAccountHeroLink" href="/customer?mode=signin" aria-label="Sign In — open saved websites with a secure email link">Sign In</Link>
            <Link className="btn light customerAccountHeroLink" href="/customer?mode=create" aria-label="Create Free Account — save a browser draft permanently">Create Free Account</Link>
            <span className="returningCustomerPrompt">Already started a website? Sign in to open your drafts. Want to save your work permanently? Create a free account.</span>
          </>
        )}
        {checking && <span className="returningCustomerPrompt">Checking your secure account…</span>}
        {feedback && <span className={`customerAccountFeedback ${accountState === 'error' ? 'accountError' : ''}`} role="status" aria-live="polite">{feedback}</span>}
      </div>
    );
  }

  return (
    <span className="navAccountControl" data-account-state={accountState}>
      {signedIn ? (
        <>
          <Link className="navAccountLink" href="/customer" aria-label="My Websites — open customer-owned drafts and websites">My Websites</Link>
          <Link className="navAccountSecondary" href="/customer/account">Account</Link>
          <button className="navAccountButton" type="button" onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <Link className="navAccountLink" href="/customer?mode=signin" aria-label="Sign In to the Mini Website Builder">Sign In</Link>
          <Link className="navAccountSecondary" href="/customer?mode=create" aria-label="Create a free Mini Website Builder account">Create Free Account</Link>
        </>
      )}
      {checking && <span className="navAccountChecking" aria-hidden="true">Checking…</span>}
      {feedback && <span className="srOnly" role="status" aria-live="polite">{feedback}</span>}
    </span>
  );
}
