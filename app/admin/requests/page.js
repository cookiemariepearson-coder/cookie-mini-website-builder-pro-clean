'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../../../lib/Nav';

function formatDate(value) {
  try { return value ? new Date(value).toLocaleString() : '—'; } catch { return '—'; }
}

function statusLabel(value) {
  if (value === 'accepted') return 'Email accepted';
  if (value === 'partial') return 'Partially delivered';
  if (value === 'rejected') return 'Saved; email delayed';
  return 'Pending';
}

export default function CustomerRequestsAdminPage() {
  const [email, setEmail] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [requests, setRequests] = useState([]);
  const [configuration, setConfiguration] = useState([]);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('Checking your secure owner session...');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setAuthorized(false);
        setMessage(data.error || 'Owner sign-in required.');
        return;
      }
      setAuthorized(true);
      setRequests(data.requests || []);
      setConfiguration(data.checkoutConfiguration || []);
      setMessage('Support and Done-for-You requests loaded. Newest requests appear first.');
    } catch {
      setAuthorized(false);
      setMessage('Requests could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function requestOwnerLink(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/admin/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      setMessage(data.message || data.error || 'The secure owner link could not be sent.');
    } catch {
      setMessage('The secure owner link could not be sent. Try again shortly.');
    } finally {
      setLoading(false);
    }
  }

  const visibleRequests = useMemo(() => requests.filter((item) => (
    filter === 'all' || item.request_type === filter || item.notification_status === filter
  )), [requests, filter]);

  return <>
    <Nav />
    <main className="wrap dashboard adminWarmPage">
      <section className="adminWarmHero">
        <div><span className="kicker">Owner only</span><h1>Customer Requests</h1><p>Review Contact Us and Done-for-You requests even if an email provider notification is delayed.</p></div>
        <div className="adminHeroBadge" aria-hidden="true"><span>✦</span><strong>Support</strong><small>Request Inbox</small></div>
      </section>
      <nav className="adminQuickLinks" aria-label="Admin tools">
        <a href="/admin">Website Management</a>
        <a href="/admin/subscriptions">Subscriptions &amp; Access</a>
        <a href="/admin/video-credits">AI Video Credits</a>
        <a className="active" href="/admin/requests">Customer Requests</a>
      </nav>

      {!authorized ? <section className="adminPanel">
        <h2>Secure owner sign-in required</h2>
        <p>Only the authorized platform owner can view customer request details.</p>
        <form onSubmit={requestOwnerLink}>
          <div className="field"><label htmlFor="request-admin-email">Authorized owner email</label><input id="request-admin-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Email Secure Sign-In Link'}</button>
        </form>
        <div className="notice" role="status" aria-live="polite">{message}</div>
      </section> : <>
        <section className="adminPanel">
          <div className="row" style={{ alignItems: 'end' }}>
            <div className="field"><label htmlFor="request-filter">Show requests</label><select id="request-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All</option><option value="contact">Contact Us</option><option value="done-for-you">Done-for-You</option><option value="partial">Partially delivered</option><option value="rejected">Email delayed</option></select></div>
            <button className="btn dark" type="button" disabled={loading} onClick={load}>{loading ? 'Refreshing...' : 'Refresh Requests'}</button>
          </div>
          <div className="notice" role="status" aria-live="polite">{message}</div>
        </section>

        <section className="adminPanel">
          <h2>Done-for-You checkout readiness</h2>
          <div className="tableWrap"><table className="table"><thead><tr><th>Service</th><th>Production setting</th><th>Status</th></tr></thead><tbody>{configuration.map((item) => <tr key={item.service}><td>{item.service}</td><td><code>{item.environmentVariable}</code></td><td>{item.configured ? 'Configured' : 'Missing or invalid'}</td></tr>)}</tbody></table></div>
        </section>

        <section className="adminPanel">
          <h2>Saved customer requests</h2>
          {!visibleRequests.length ? <div className="notice">No requests match this filter.</div> : <div className="cardGrid oneCol">{visibleRequests.map((item) => <article className="card" key={item.request_id}>
            <h3>{item.request_type === 'contact' ? 'Contact Us' : item.service || 'Done-for-You'} — {item.business_name || item.customer_name}</h3>
            <p><strong>Request:</strong> {item.request_id}<br /><strong>Received:</strong> {formatDate(item.created_at)}<br /><strong>Notification:</strong> {statusLabel(item.notification_status)}</p>
            <p><strong>Customer:</strong> {item.customer_name}<br /><strong>Email:</strong> <a href={`mailto:${item.customer_email}`}>{item.customer_email}</a>{item.phone ? <><br /><strong>Phone:</strong> {item.phone}</> : null}</p>
            {item.business_type ? <p><strong>Business type:</strong> {item.business_type}</p> : null}
            {item.customer_action ? <p><strong>Customer action:</strong> {item.customer_action}</p> : null}
            <p style={{ whiteSpace: 'pre-wrap' }}><strong>Details:</strong><br />{item.details}</p>
            {item.checkout_required ? <p><strong>Checkout:</strong> {item.checkout_configured ? 'Configured when submitted' : 'Was unavailable when submitted'}</p> : null}
            {item.notification_error ? <div className="notice">{item.notification_error}</div> : null}
          </article>)}</div>}
        </section>
      </>}
    </main>
  </>;
}
