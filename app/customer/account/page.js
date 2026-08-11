'use client';

import { useEffect, useState } from 'react';
import Nav from '../../../lib/Nav';

const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';
const LOCAL_DRAFT_KEYS = ['cookieDraftSite', 'cookieDraftSitesIndex', 'cookieBuilderStep', 'cookieBuilderCurrentSlug', 'cookieGuestDraftClaimV1'];
const AI_HISTORY_KEYS = ['cookieAiAssistantV2Messages', 'cookieAiAssistantPlanState'];

export default function CustomerAccountPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Checking your secure account…');
  const [confirmation, setConfirmation] = useState('');
  const [websites, setWebsites] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!token) {
      setStatus('Sign in to view account controls.');
      return;
    }
    fetch('/api/auth/site-owner/session', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error || 'Session expired.');
        setEmail(data.email || '');
        return fetch('/api/site/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: '' })
        }).then(response => response.json()).then(result => {
          setWebsites(result.ok ? (result.sites || []) : []);
          setStatus('Secure account session confirmed.');
        });
      })
      .catch(() => setStatus('Your secure session expired. Sign in again to use account controls.'));
  }, []);

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ''}` };
  }

  async function exportData() {
    setStatus('Preparing your account export…');
    const response = await fetch('/api/account/export', { headers: authHeaders() });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setStatus(result.error || 'Your export could not be prepared.');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cookie-mini-builder-account-export.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Account export downloaded.');
  }

  function clearKeys(keys, label) {
    for (const key of keys) localStorage.removeItem(key);
    setStatus(`${label} cleared from this browser. Cloud websites and purchases were not changed.`);
  }

  async function requestDeletion() {
    setStatus('Sending your confirmed deletion request…');
    const response = await fetch('/api/account/delete-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ confirmation })
    });
    const result = await response.json();
    setStatus(result.ok ? result.message : (result.error || 'Your request could not be sent.'));
  }

  return (
    <>
      <Nav />
      <main className="wrap customerAccountPage">
        <section className="dashboard">
          <span className="kicker">Customer account</span>
          <h1>Account</h1>
          <p>Manage your Mini Website Builder session, browser-local information, data export, and support requests.</p>
          <div className="notice" role="status" aria-live="polite">{status}</div>
          <div className="accountControlGrid">
            <article><h2>Account email</h2><p>{email || 'Sign in required'}</p><a className="btn light" href="/customer">My Websites</a></article>
            <article><h2>Plans &amp; websites</h2>{websites.length ? <ul>{websites.map(site => <li key={site.slug}><strong>{site.business_name || site.slug}</strong>: {site.plan || 'free'} — {site.status || 'draft'}</li>)}</ul> : <p>No customer-owned cloud websites loaded.</p>}</article>
            <article><h2>Export my data</h2><p>Download customer-owned websites and account information as JSON.</p><button className="btn" type="button" onClick={exportData} disabled={!email}>Export My Data</button></article>
            <article><h2>Browser data</h2><p>These actions affect only this browser and do not remove cloud websites or purchases.</p><button className="btn light" type="button" onClick={() => clearKeys(LOCAL_DRAFT_KEYS, 'Local guest drafts')}>Clear Local Guest Drafts</button>{' '}<button className="btn light" type="button" onClick={() => clearKeys(AI_HISTORY_KEYS, 'AI conversation history')}>Clear AI Conversation History</button></article>
            <article><h2>Privacy &amp; support</h2><p>Review how account email and website information are used, or ask Cookie for help.</p><a className="btn light" href="/privacy">Privacy Policy</a>{' '}<a className="btn light" href="/contact">Contact Support</a></article>
          </div>
          <details className="accountDeletePanel">
            <summary>Request account deletion</summary>
            <p>This can permanently remove account access and customer-owned website data after support verifies subscriptions and required transaction retention. It cannot be reversed. It does not automatically cancel or refund a Gumroad purchase.</p>
            <label htmlFor="delete-account-confirmation">Type DELETE MY ACCOUNT to confirm the request</label>
            <input id="delete-account-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" />
            <button className="btn" type="button" onClick={requestDeletion} disabled={!email || confirmation !== 'DELETE MY ACCOUNT'}>Send Deletion Request</button>
          </details>
        </section>
      </main>
    </>
  );
}
