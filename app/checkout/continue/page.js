'use client';

import { useEffect, useState } from 'react';
import Nav from '../../../lib/Nav';
import { useAccountModal } from '../../../components/AccountModalProvider';

const PLAN_LABELS = Object.freeze({
  starter: 'Starter Pro — $19/month',
  business: 'Business — $30/month',
  premium: 'Premium — $50/month',
  extra: 'Extra Page Add-On — $10/month per page'
});

export default function ContinueWebsiteCheckout() {
  const { accountState, openAccountModal } = useAccountModal();
  const [intent, setIntent] = useState(null);
  const [message, setMessage] = useState('Loading your secure checkout…');

  useEffect(() => {
    async function loadCheckout() {
      const params = new URLSearchParams(window.location.search);
      const intentId = params.get('intent') || '';
      if (!intentId) {
        setMessage('This checkout link is incomplete. Return to Pricing and select your plan again.');
        return;
      }
      try {
        const response = await fetch(`/api/checkout/intent/status?id=${encodeURIComponent(intentId)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!data.ok || !data.intentId) {
          setMessage(data.error || 'This checkout is no longer available. Return to Pricing to start again.');
          return;
        }
        const loadedIntent = { id: data.intentId, plan: data.plan, draftSlug: data.draftSlug || '', status: data.status };
        setIntent(loadedIntent);
        if (accountState !== 'signed-in') {
          setMessage('Sign in or create an account. Your exact plan and website will continue automatically after secure authentication.');
          return;
        }
        setMessage('Your secure session was found. Resuming checkout…');
        const resumeResponse = await fetch('/api/checkout/intent/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId })
        });
        const resumed = await resumeResponse.json();
        if (resumed.ok && resumed.builderPath) {
          window.location.replace(resumed.builderPath);
          return;
        }
        setMessage(resumed.error || 'Sign in to continue this saved checkout.');
      } catch {
        setMessage('Checkout could not be loaded right now. Your website draft is still safe; please try again shortly.');
      }
    }
    loadCheckout();
  }, [accountState]);

  return (
    <>
      <Nav />
      <main className="wrap dashboard" data-testid="checkout-auth-page">
        <span className="kicker">Secure paid-plan checkout</span>
        <h1>Continue Your Website Purchase</h1>
        {intent && (
          <div className="notice">
            <strong>{PLAN_LABELS[intent.plan] || 'Paid website plan'}</strong><br />
            Website: {intent.draftSlug || 'your saved Builder website'}
          </div>
        )}
        <p>We verify the customer account before payment so the subscription, website, and future publishing access belong to the correct customer.</p>
        <div className="notice" role="status" aria-live="polite">{message}</div>
        {intent && accountState !== 'signed-in' && <button className="btn" type="button" onClick={() => openAccountModal({ mode: 'signin', destination: `/checkout/continue?intent=${encodeURIComponent(intent.id)}${intent.draftSlug ? `&draft=${encodeURIComponent(intent.draftSlug)}` : ''}` })}>Sign In and Continue Purchase</button>}
        <p><a className="btn dark" href="/builder">Return to Builder</a></p>
      </main>
    </>
  );
}
