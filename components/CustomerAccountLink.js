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
    try {
      token = window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
    } catch {}
    if (!token) return () => { active = false; };

    setAccountState('checking');
    setFeedback('Checking your secure customer session.');
    fetch('/api/auth/site-owner/session', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => response.json().then(data => ({ ok: response.ok && data.ok })))
      .then(result => {
        if (!active) return;
        if (result.ok) {
          setAccountState('signed-in');
          setFeedback('Secure customer session confirmed. My Drafts is ready.');
          return;
        }
        try { window.localStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
        setAccountState('signed-out');
        setFeedback('Your previous session ended. Customer Sign In is available.');
      })
      .catch(() => {
        if (!active) return;
        setAccountState('error');
        setFeedback('We could not check your saved session. Customer Sign In is still available.');
      });

    return () => { active = false; };
  }, []);

  const signedIn = accountState === 'signed-in';
  const checking = accountState === 'checking';
  const label = signedIn ? 'My Drafts' : checking ? 'Checking Account…' : 'Customer Sign In';
  const href = signedIn ? '/customer' : '/customer?signin=1';
  const accessibleLabel = signedIn
    ? 'My Drafts — open your secure Customer Dashboard'
    : 'Customer Sign In — access saved drafts and purchased websites';

  if (placement === 'hero') {
    return (
      <div className="returningCustomerAccess" data-account-state={accountState}>
        <Link className="btn light customerAccountHeroLink" href={href} aria-label={accessibleLabel}>
          {label}
        </Link>
        <span className="returningCustomerPrompt">
          {signedIn
            ? 'Welcome back. Open your drafts and purchased websites.'
            : 'Already started a website? Sign in to open your drafts.'}
        </span>
        {feedback && (
          <span className={`customerAccountFeedback ${accountState === 'error' ? 'accountError' : ''}`} role="status" aria-live="polite">
            {feedback}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="navAccountControl" data-account-state={accountState}>
      <Link className="navAccountLink" href={href} aria-label={accessibleLabel}>{label}</Link>
      {feedback && <span className="srOnly" role="status" aria-live="polite">{feedback}</span>}
    </span>
  );
}
