'use client';

import { useEffect, useState } from 'react';
import { PENDING_CHECKOUT_STORAGE_KEY, resolveCustomerContinuation } from '../../../../lib/commerceConfig.mjs';

const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';

export default function CustomerAuthCallback() {
  const [message, setMessage] = useState('Verifying your secure email link...');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('access_token');
    const error = hash.get('error_description') || hash.get('error');
    const returnPath = resolveCustomerContinuation(
      new URLSearchParams(window.location.search).get('return'),
      localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY)
    );

    if (error || !token) {
      setMessage(error || 'This secure sign-in link is invalid or expired. Return to My Website and request a new link.');
      return;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    window.location.replace(`${returnPath}${returnPath.includes('?') ? '&' : '?'}verified=1`);
  }, []);

  return (
    <main className="wrap dashboard">
      <span className="kicker">Secure Customer Access</span>
      <h1>Signing you in</h1>
      <p>{message}</p>
      <a className="btn light" href="/customer">Return to My Website</a>
    </main>
  );
}
