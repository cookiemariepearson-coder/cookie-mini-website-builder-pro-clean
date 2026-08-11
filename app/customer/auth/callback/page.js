'use client';

import { useEffect, useState } from 'react';
import { PENDING_CHECKOUT_STORAGE_KEY, resolveCustomerContinuation } from '../../../../lib/commerceConfig.mjs';

export default function CustomerAuthCallback() {
  const [message, setMessage] = useState('Verifying your secure email link...');

  useEffect(() => {
    async function finishSignIn() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const token = hash.get('access_token');
      const error = hash.get('error_description') || hash.get('error');
      const query = new URLSearchParams(window.location.search);
      const intentId = query.get('intent') || '';
      let returnPath = resolveCustomerContinuation(
        query.get('return'),
        localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY)
      );

      if (error || !token) {
        setMessage(error || 'This secure sign-in link is invalid or expired. Return to My Website and request a new link.');
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      const adoptionResponse = await fetch('/api/auth/site-owner/session', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!adoptionResponse.ok) {
        setMessage('This secure sign-in link is invalid or expired. Return to My Websites and sign in again.');
        return;
      }
      if (intentId) {
        try {
          const response = await fetch('/api/checkout/intent/resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intentId })
          });
          const recovered = await response.json();
          if (!recovered.ok || !recovered.builderPath) {
            setMessage(recovered.error || 'Your email was verified, but checkout could not resume. Open My Website to use Continue Purchase.');
            return;
          }
          localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
          window.location.replace(recovered.builderPath);
          return;
        } catch {
          setMessage('Your email was verified, but checkout could not resume. Open My Website to use Continue Purchase.');
          return;
        }
      }
      if (returnPath === '/customer') {
        try {
          const response = await fetch('/api/auth/site-owner/continuation', {
            cache: 'no-store'
          });
          const recovered = await response.json();
          if (recovered.ok && recovered.returnPath) returnPath = recovered.returnPath;
        } catch {}
      }
      window.location.replace(`${returnPath}${returnPath.includes('?') ? '&' : '?'}verified=1`);
    }
    finishSignIn();
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
