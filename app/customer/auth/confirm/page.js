'use client';

import { useEffect, useState } from 'react';
import Nav from '../../../../lib/Nav';

const GUEST_CLAIM_KEY = 'cookieGuestDraftClaimV1';

export default function BuilderCheckoutAuthConfirm() {
  const [title, setTitle] = useState('Continue Secure Checkout');
  const [recoveryLabel, setRecoveryLabel] = useState('Continue Secure Checkout');
  const [message, setMessage] = useState('Verifying your secure Builder checkout link…');
  const [recoveryPath, setRecoveryPath] = useState('/pricing');

  useEffect(() => {
    async function verifyAndResume() {
      const query = new URLSearchParams(window.location.search);
      const intentId = query.get('intent') || '';
      const returnPath = query.get('return') || '/customer';
      const authMode = query.get('mode') === 'create' ? 'create' : 'signin';
      if (!intentId) {
        setTitle(authMode === 'create' ? 'Create Your Free Account' : 'Open My Websites Securely');
        setRecoveryLabel('Return to My Websites');
      }
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const tokenHash = hash.get('token_hash') || '';
      const type = hash.get('type') || '';
      const continuePath = intentId ? `/checkout/continue?intent=${encodeURIComponent(intentId)}` : '/customer';
      setRecoveryPath(continuePath);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

      if (!tokenHash || !type) {
        setMessage('This secure email link is incomplete or expired. Return to your saved checkout and request a new link.');
        return;
      }

      try {
        const confirmationResponse = await fetch('/api/auth/site-owner/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId, returnPath, tokenHash, type, authMode })
        });
        const confirmation = await confirmationResponse.json();
        if (!confirmation.ok) {
          setMessage(confirmation.error || 'This secure email link could not be verified. Request a new link from your saved checkout.');
          return;
        }

        if (!intentId) {
          let claimed = false;
          try {
            const claim = JSON.parse(localStorage.getItem(GUEST_CLAIM_KEY) || 'null');
            if (claim?.claimId && claim?.claimToken) {
              setMessage('Account verified. Saving this browser draft permanently…');
              const claimResponse = await fetch('/api/site/guest-draft/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claimId: claim.claimId, claimToken: claim.claimToken })
              });
              const claimResult = await claimResponse.json();
              if (claimResult.ok) {
                claimed = true;
                localStorage.removeItem(GUEST_CLAIM_KEY);
                localStorage.setItem('cookieGuestDraftClaimedSlug', claimResult.slug || '');
              }
            }
          } catch {}
          setMessage(claimed ? 'Account created and browser draft saved. Opening My Websites…' : 'Email verified. Opening My Websites…');
          const separator = confirmation.returnPath.includes('?') ? '&' : '?';
          window.location.replace(`${confirmation.returnPath}${separator}verified=1&mode=${encodeURIComponent(confirmation.authMode || authMode)}${claimed ? '&claimed=1' : ''}`);
          return;
        }
        setMessage('Email verified. Restoring your exact plan and website…');
        const resumeResponse = await fetch('/api/checkout/intent/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        <h1>{title}</h1>
        <div className="notice" role="status" aria-live="polite">{message}</div>
        <p>
          <a className="btn" href={recoveryPath}>{recoveryLabel}</a>{' '}
          <a className="btn dark" href="/builder">Return to Builder</a>
        </p>
      </main>
    </>
  );
}
