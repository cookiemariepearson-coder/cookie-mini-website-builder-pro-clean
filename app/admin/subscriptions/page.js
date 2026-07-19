'use client';

import { useState } from 'react';
import Nav from '../../../lib/Nav';

const subscriptionOptions = ['active','unverified','canceled','ended','refunded','disputed','paused'];
const accessOptions = ['active','paused','archived'];
const siteStatusOptions = ['published','paused','draft','archived'];
const planOptions = ['free','starter','business','premium'];

const cardStyle = {
  border: '1px solid rgba(32,23,47,.12)',
  borderRadius: 22,
  padding: 18,
  background: 'rgba(255,255,255,.94)',
  boxShadow: '0 18px 45px rgba(32,23,47,.08)',
  overflow: 'hidden'
};

function pill(status) {
  const s = String(status || 'unverified');
  const color = ['active','published'].includes(s) ? '#147d43' : ['paused','canceled','ended','refunded','disputed','archived'].includes(s) ? '#a12d2d' : '#8a6500';
  return <span style={{ background: color, color: 'white', padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 800, display: 'inline-block' }}>{s}</span>;
}

function formatDate(date) {
  try { return date ? new Date(date).toLocaleString() : '—'; } catch { return '—'; }
}

export default function GumroadSubscriptionsAdmin() {
  const [pin, setPin] = useState('');
  const [ready, setReady] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  async function load() {
    setLoading(true);
    setMsg('');
    const res = await fetch('/api/admin/subscriptions/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setMsg(data.error || 'Could not load subscription dashboard.');
      return;
    }
    setReady(true);
    setWebsites(data.websites || []);
    setEvents(data.events || []);
  }

  async function update(slug, updates) {
    const res = await fetch('/api/admin/subscriptions/manual-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, slug, updates })
    });
    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error || 'Update failed.');
      return;
    }
    setMsg('Saved admin update.');
    await load();
  }

  async function registerHooks() {
    setRegistering(true);
    setMsg('');
    const res = await fetch('/api/gumroad/register-webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    setRegistering(false);
    if (!data.ok) {
      setMsg(data.error || 'Webhook registration failed.');
      return;
    }
    setMsg('Gumroad webhook registration request completed. Check Gumroad resource subscriptions if needed.');
    setEvents([{ resource_name: 'setup', action_taken: JSON.stringify(data.results, null, 2), processed_at: new Date().toISOString() }, ...events]);
  }

  const activeCount = websites.filter(w => w.access_status === 'active' && w.status === 'published').length;
  const pausedCount = websites.filter(w => w.access_status === 'paused' || w.status === 'paused').length;
  const unmatchedEvents = events.filter(e => !e.matched_slug).length;

  return (
    <>
      <Nav />
      <main className="wrap dashboard" style={{ maxWidth: 1260 }}>
        <span className="kicker">Owner only</span>
        <h1>Gumroad Subscription Status + Access Control</h1>
        <p>This page tracks paid website access, subscription status, and Gumroad events.</p>

        {!ready && (
          <section className="card">
            <h2>Enter Admin PIN</h2>
            <div className="field">
              <label>Admin PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter your PIN"
                autoComplete="new-password"
                name="cookie-subscription-admin-pin"
              />
            </div>
            <button className="btn" onClick={load} disabled={loading}>{loading ? 'Opening...' : 'Open Subscription Dashboard'}</button>
            {msg && <div className="notice danger">{msg}</div>}
          </section>
        )}

        {ready && (
          <>
            <div className="navRow" style={{ flexWrap: 'wrap', gap: 12 }}>
              <button className="btn dark" onClick={() => { setReady(false); setPin(''); setWebsites([]); setEvents([]); }}>Lock Dashboard</button>
              <button className="btn" onClick={load}>Refresh</button>
              <button className="btn light" onClick={registerHooks} disabled={registering}>{registering ? 'Registering...' : 'Register Gumroad Webhooks'}</button>
              <a className="btn light" href="/admin">Back to Admin</a>
            </div>
            {msg && <div className="notice">{msg}</div>}

            <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div><strong>{websites.length}</strong><span>Total Sites</span></div>
              <div><strong>{activeCount}</strong><span>Active</span></div>
              <div><strong>{pausedCount}</strong><span>Paused</span></div>
              <div><strong>{unmatchedEvents}</strong><span>Unmatched Gumroad Events</span></div>
            </div>

            <section className="card">
              <h2>Websites & Subscription Access</h2>
              <p className="mutedText">Cards prevent the subscription controls from getting cut off on smaller screens. Use each card to update plan, access, status, and private notes.</p>

              <div style={{ display: 'grid', gap: 16 }}>
                {websites.map(w => (
                  <article key={w.slug} style={cardStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.25fr) repeat(4, minmax(145px, .8fr)) minmax(220px, 1.2fr)', gap: 14, alignItems: 'start' }} className="subscriptionCardGrid">
                      <div>
                        <h3 style={{ margin: '0 0 6px' }}>{w.businessName || w.business_name || w.slug}</h3>
                        <a href={`https://${w.slug}.cookiesdigitalcreations.com`} target="_blank" rel="noreferrer">{w.slug}</a>
                        <p style={{ marginTop: 10 }}><small>{w.customer_email || w.email || w.gumroad_email || 'No email saved'}</small></p>
                      </div>

                      <div className="field compactField">
                        <label>Plan</label>
                        <select value={w.plan || 'free'} onChange={e => update(w.slug, { plan: e.target.value })}>{planOptions.map(x => <option key={x}>{x}</option>)}</select>
                      </div>

                      <div className="field compactField">
                        <label>Subscription</label>
                        {pill(w.subscription_status)}
                        <select value={w.subscription_status || 'unverified'} onChange={e => update(w.slug, { subscription_status: e.target.value })}>{subscriptionOptions.map(x => <option key={x}>{x}</option>)}</select>
                      </div>

                      <div className="field compactField">
                        <label>Access</label>
                        {pill(w.access_status)}
                        <select value={w.access_status || 'active'} onChange={e => update(w.slug, { access_status: e.target.value, status: e.target.value === 'active' ? 'published' : 'paused', paused_reason: e.target.value === 'paused' ? 'Paused manually by admin.' : '' })}>{accessOptions.map(x => <option key={x}>{x}</option>)}</select>
                      </div>

                      <div className="field compactField">
                        <label>Site Status</label>
                        <select value={w.status || 'published'} onChange={e => update(w.slug, { status: e.target.value })}>{siteStatusOptions.map(x => <option key={x}>{x}</option>)}</select>
                      </div>

                      <div className="field compactField">
                        <label>Private Notes</label>
                        <textarea rows={3} defaultValue={w.admin_notes || ''} onBlur={e => update(w.slug, { admin_notes: e.target.value })} placeholder="Private admin notes" />
                        <small>Gumroad: {w.gumroad_product_name || 'No product yet'} / {w.gumroad_last_event || 'No event'} {w.gumroad_last_event_at ? formatDate(w.gumroad_last_event_at) : ''}</small>
                      </div>
                    </div>
                  </article>
                ))}
                {websites.length === 0 && <div className="notice">No websites found yet.</div>}
              </div>
            </section>

            <section className="card">
              <h2>Recent Gumroad Events</h2>
              <p>Events with no matched website need manual review. The checkout custom field should be named <strong>Website name or subdomain you are upgrading</strong>.</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {events.map((e, i) => (
                  <div key={e.id || i} style={cardStyle}>
                    <strong>{e.resource_name || 'event'}</strong> · <small>{formatDate(e.processed_at)}</small><br />
                    <small>Email: {e.email || '—'} | Product: {e.product_name || '—'} | Matched: {e.matched_slug || 'Needs review'}</small>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#170c24', color: '#fff', padding: 12, borderRadius: 12 }}>{e.action_taken || ''}</pre>
                  </div>
                ))}
                {events.length === 0 && <div className="notice">No Gumroad events received yet.</div>}
              </div>
            </section>

            <section className="card">
              <h2>Webhook URL</h2>
              <p>Use this endpoint for Gumroad resource subscriptions if you set them manually:</p>
              <pre style={{ whiteSpace: 'pre-wrap' }}>https://www.cookiesdigitalcreations.com/api/gumroad/webhook?resource=sale</pre>
              <p>Create one subscription for each resource: sale, refund, cancellation, subscription_ended, subscription_restarted, subscription_updated, dispute, and dispute_won.</p>
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        @media (max-width: 1050px) {
          .subscriptionCardGrid { grid-template-columns: 1fr !important; }
        }
        .compactField { margin: 0; }
        .compactField label { display:block; font-weight: 800; margin-bottom: 6px; }
        .compactField select, .compactField textarea { width: 100%; max-width: 100%; }
      `}</style>
    </>
  );
}
