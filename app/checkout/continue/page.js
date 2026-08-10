'use client';

import { useEffect, useState } from 'react';
import Nav from '../../../lib/Nav';

const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';
const PLAN_LABELS = Object.freeze({
  starter: 'Starter Pro — $19/month',
  business: 'Business — $30/month',
  premium: 'Premium — $50/month',
  extra: 'Extra Page Add-On — $10/month per page'
});

export default function ContinueWebsiteCheckout() {
  const [intent, setIntent] = useState(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('Loading your secure checkout…');
  const [sending, setSending] = useState(false);

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
        const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
        if (!token) {
          setMessage('Verify your email once. After verification, your exact plan and website will continue automatically to Gumroad.');
          return;
        }
        setMessage('Your secure session was found. Resuming checkout…');
        const resumeResponse = await fetch('/api/checkout/intent/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ intentId })
        });
        const resumed = await resumeResponse.json();
        if (resumed.ok && resumed.builderPath) {
          window.location.replace(resumed.builderPath);
          return;
        }
        if (resumeResponse.status === 401) localStorage.removeItem(AUTH_TOKEN_KEY);
        setMessage(resumed.error || 'Verify your email to continue this saved checkout.');
      } catch {
        setMessage('Checkout could not be loaded right now. Your website draft is still safe; please try again shortly.');
      }
    }
    loadCheckout();
  }, []);

  async function requestSecureLink(event) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !intent?.id) return;
    setSending(true);
    setMessage('Requesting your secure checkout email…');
    try {
      const response = await fetch('/api/auth/site-owner/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, intentId: intent.id, draftSlug: intent.draftSlug || '' })
      });
      const data = await response.json();
      setMessage(data.ok ? data.message : (data.error || 'The secure checkout email could not be requested.'));
    } catch {
      setMessage('The secure checkout email could not be requested. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

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
        <p>We verify your email before payment so the subscription, website, and future publishing access belong to the correct customer.</p>
        <div className="notice" role="status" aria-live="polite">{message}</div>
        {intent && (
          <form onSubmit={requestSecureLink}>
            <div className="field">
              <label htmlFor="checkout-email">Email for this website purchase</label>
              <input id="checkout-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <button className="btn" type="submit" disabled={sending}>{sending ? 'Requesting Secure Link…' : 'Email My Secure Checkout Link'}</button>
          </form>
        )}
        <p><a className="btn dark" href="/builder">Return to Builder</a></p>
      </main>
    </>
  );
}
