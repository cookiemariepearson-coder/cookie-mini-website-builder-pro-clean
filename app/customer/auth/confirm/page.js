'use client';

import { useEffect, useState } from 'react';
import Nav from '../../../../lib/Nav';

const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';

export default function BuilderCheckoutAuthConfirm() {
  const [message, setMessage] = useState('Verifying your secure Builder checkout link…');
  const [recoveryPath, setRecoveryPath] = useState('/pricing');

  useEffect(() => {
    async function verifyAndResume() {
      const query = new URLSearchParams(window.location.search);
      const intentId = query.get('intent') || '';
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const tokenHash = hash.get('token_hash') || '';
      const type = hash.get('type') || '';
      const continuePath = intentId ? `/checkout/continue?intent=${encodeURIComponent(intentId)}` : '/pricing';
      setRecoveryPath(continuePath);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

      if (!intentId || !tokenHash || !type) {
        setMessage('This secure email link is incomplete or expired. Return to your saved checkout and request a new link.');
        return;
      }

      try {
        const confirmationResponse = await fetch('/api/auth/site-owner/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId, tokenHash, type })
        });
        const confirmation = await confirmationResponse.json();
        if (!confirmation.ok || !confirmation.accessToken) {
          setMessage(confirmation.error || 'This secure email link could not be verified. Request a new link from your saved checkout.');
          return;
        }

        localStorage.setItem(AUTH_TOKEN_KEY, confirmation.accessToken);
        setMessage('Email verified. Restoring your exact plan and website…');
        const resumeResponse = await fetch('/api/checkout/intent/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${confirmation.accessToken}` },
          body: JSON.stringify({ intentId })
        });
        const resumed = await resumeResponse.json();
        if (!resumed.ok || !resumed.builderPath) {
          setMessage(resumed.error || 'Your email was verified, but checkout needs one more step. Choose Continue Secure Checkout below.');
          return;
        }
        window.location.replace(resumed.builderPath);
      } catch {
        setMessage('Your secure checkout could not resume right now. Your website and selected plan are still saved.');
      }
    }
    verifyAndResume();
  }, []);

  return (
    <>
      <Nav />
      <main className="wrap dashboard" data-testid="builder-checkout-auth-confirm">
        <span className="kicker">Cookie Mini Website Builder Pro</span>
        <h1>Continue Secure Checkout</h1>
        <div className="notice" role="status" aria-live="polite">{message}</div>
        <p>
          <a className="btn" href={recoveryPath}>Continue Secure Checkout</a>{' '}
          <a className="btn dark" href="/builder">Return to Builder</a>
        </p>
      </main>
    </>
  );
}
