'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../../lib/Nav';

const planPrices = { free: 0, starter: 19, business: 30, premium: 50 };
const planNames = {
  free: 'Free Launch Page',
  starter: 'Starter Pro',
  business: 'Business',
  premium: 'Premium'
};
const statuses = ['published', 'paused', 'draft', 'archived'];

function siteUrl(slug) {
  return `https://${slug}.cookiesdigitalcreations.com`;
}

function directUrl(slug) {
  return `https://www.cookiesdigitalcreations.com/site/${slug}`;
}

function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

const tabBtn = (active) => ({
  border: active ? '2px solid #20172f' : '1px solid #ded5e7',
  background: active ? '#20172f' : '#fff',
  color: active ? '#fff' : '#20172f',
  padding: '12px 16px',
  borderRadius: 999,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: active ? '0 12px 30px rgba(32, 23, 47, .18)' : 'none'
});

const card = {
  background: '#fff',
  border: '1px solid #e7deef',
  borderRadius: 22,
  padding: 22,
  boxShadow: '0 18px 45px rgba(32,23,47,.08)',
  marginBottom: 18
};

function pinMessage(text) {
  return <div className="notice">{text}</div>;
}

export default function Admin() {
  const [pin, setPin] = useState('');
  const [sessionPin, setSessionPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [sites, setSites] = useState([]);
  const [msg, setMsg] = useState('Enter your private admin PIN to open the admin dashboard.');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('websites');
  const [loading, setLoading] = useState(false);
  const [savingSlug, setSavingSlug] = useState('');

  useEffect(() => {
    const clearTimer = setTimeout(() => setPin(''), 250);
    return () => clearTimeout(clearTimer);
  }, []);

  async function loadAdmin(candidatePin = sessionPin || pin) {
    const checkPin = String(candidatePin || '').trim();
    if (!checkPin) {
      setMsg('Enter your ADMIN_PIN first.');
      return;
    }
    setLoading(true);
    setMsg('Checking PIN...');
    try {
      const r = await fetch('/api/admin/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: checkPin })
      });
      const d = await r.json();
      if (d.ok) {
        setSites(d.sites || []);
        setSessionPin(checkPin);
        setPin('');
        setUnlocked(true);
        setMsg('Admin Plan Management v2 loaded. Use the tabs below to manage websites, plans, notes, and archived sites.');
      } else {
        setUnlocked(false);
        setSessionPin('');
        setSites([]);
        setMsg(d.error || 'Invalid PIN. Please try again.');
      }
    } catch (e) {
      setUnlocked(false);
      setSessionPin('');
      setSites([]);
      setMsg(e.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  function lockAdmin() {
    setUnlocked(false);
    setPin('');
    setSessionPin('');
    setSites([]);
    setSearch('');
    setTab('websites');
    setMsg('Admin dashboard locked. Enter your private admin PIN to open it again.');
  }

  async function update(slug, updates, quiet = false) {
    if (!unlocked || !sessionPin) {
      setMsg('Admin is locked. Enter your PIN first.');
      return;
    }
    setSavingSlug(slug);
    try {
      const r = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: sessionPin, slug, updates })
      });
      const d = await r.json();
      if (d.ok) {
        if (!quiet) setMsg('Saved admin change.');
        await loadAdmin(sessionPin);
      } else {
        setMsg(d.error || 'Unable to update website.');
      }
    } catch (e) {
      setMsg(e.message || 'Unable to update website.');
    } finally {
      setSavingSlug('');
    }
  }

  function patchLocal(slug, updates) {
    setSites((items) => items.map((site) => (site.slug === slug ? { ...site, ...updates } : site)));
  }

  function confirmArchive(site) {
    const name = site.business_name || site.slug;
    const ok = window.confirm(`Archive ${name}? This hides it from the public website but keeps the record for your notes and history.`);
    if (ok) update(site.slug, { status: 'archived' });
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = tab === 'archived' ? sites.filter((s) => s.status === 'archived') : sites.filter((s) => s.status !== 'archived');
    if (!q) return base;
    return base.filter((s) =>
      [s.slug, s.business_name, s.customer_email, s.plan, s.status, s.admin_notes]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [sites, search, tab]);

  const stats = useMemo(() => {
    const activeSites = sites.filter((s) => s.status !== 'archived');
    const published = activeSites.filter((s) => (s.status || 'published') === 'published');
    const paused = activeSites.filter((s) => s.status === 'paused');
    const free = activeSites.filter((s) => (s.plan || 'free') === 'free');
    const archived = sites.filter((s) => s.status === 'archived');
    const mrr = published.reduce((sum, s) => {
      const plan = s.plan || 'free';
      const base = Number(s.monthly_price ?? planPrices[plan] ?? 0);
      const extra = Number(s.extra_pages || 0) * 10;
      return sum + base + extra;
    }, 0);
    return { total: activeSites.length, published: published.length, paused: paused.length, free: free.length, archived: archived.length, mrr };
  }, [sites]);

  return (
    <>
      <Nav />
      <main className="wrap dashboard">
        <span className="kicker">Owner dashboard</span>
        <h1>Admin Plan Management v2</h1>
        <p>This page is private. Enter your admin PIN before customer websites, plans, notes, and management tools are shown.</p>

        {!unlocked && (
          <>
            <section style={card}>
              <form onSubmit={(e) => { e.preventDefault(); loadAdmin(pin); }}>
                <input type="text" name="fake-user-field" autoComplete="username" style={{ display: 'none' }} tabIndex="-1" />
                <input type="password" name="fake-password-field" autoComplete="current-password" style={{ display: 'none' }} tabIndex="-1" />
                <div className="row">
                  <div className="field">
                    <label>Admin PIN</label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Type your admin PIN"
                      autoComplete="new-password"
                      name="cookie-admin-pin-manual-entry"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="field">
                    <label>&nbsp;</label>
                    <button className="btn" type="submit">{loading ? 'Checking...' : 'Open Admin'}</button>
                  </div>
                </div>
              </form>
              {msg && pinMessage(msg)}
            </section>
            <section style={{ ...card, background: '#fff8ef' }}>
              <h2 style={{ marginTop: 0 }}>Admin dashboard is locked</h2>
              <p>Customer website records, revenue totals, plan controls, private notes, and archived sites stay hidden until the correct PIN is entered.</p>
              <p><strong>Reminder:</strong> the PIN comes from your Vercel environment variable named <code>ADMIN_PIN</code>.</p>
            </section>
          </>
        )}

        {unlocked && (
          <>
            <section style={card}>
              <div className="row" style={{ alignItems: 'center' }}>
                <div>
                  <h2 style={{ marginTop: 0 }}>Admin dashboard unlocked</h2>
                  <p style={{ marginBottom: 0 }}>Your PIN is hidden. Use the tabs below to manage customer websites.</p>
                </div>
                <button className="btn dark" onClick={() => loadAdmin(sessionPin)}>{loading ? 'Refreshing...' : 'Refresh Admin'}</button>
                <button className="btn danger" onClick={lockAdmin}>Lock Admin</button>
              </div>
              {msg && pinMessage(msg)}
            </section>

            <section style={{ ...card, background: '#f7f1ff' }}>
              <h2 style={{ marginTop: 0 }}>Admin Sections</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={tabBtn(tab === 'websites')} onClick={() => setTab('websites')}>1. Websites</button>
                <button style={tabBtn(tab === 'plans')} onClick={() => setTab('plans')}>2. Plans & Status</button>
                <button style={tabBtn(tab === 'notes')} onClick={() => setTab('notes')}>3. Admin Notes</button>
                <button style={tabBtn(tab === 'archived')} onClick={() => setTab('archived')}>4. Archived</button>
                <button style={tabBtn(tab === 'help')} onClick={() => setTab('help')}>5. How to Use</button>
              </div>
            </section>

            <div className="cardGrid">
              <div className="card"><strong>Active Sites</strong><div className="price">{stats.total}</div></div>
              <div className="card"><strong>Published</strong><div className="price">{stats.published}</div></div>
              <div className="card"><strong>Paused</strong><div className="price">{stats.paused}</div></div>
              <div className="card"><strong>Free Sites</strong><div className="price">{stats.free}</div></div>
              <div className="card"><strong>Archived</strong><div className="price">{stats.archived}</div></div>
              <div className="card"><strong>Estimated Active MRR</strong><div className="price">${stats.mrr}/mo</div></div>
            </div>

            <section style={card}>
              <div className="row">
                <h2 style={{ margin: 0 }}>
                  {tab === 'websites' && 'Websites'}
                  {tab === 'plans' && 'Plans & Status'}
                  {tab === 'notes' && 'Admin Notes'}
                  {tab === 'archived' && 'Archived Websites'}
                  {tab === 'help' && 'How to Use'}
                </h2>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, slug, email, plan, status, or note" />
              </div>
            </section>

            {tab === 'websites' && (
              <section style={card}>
                <h2>Customer Websites</h2>
                <p>Open, edit, pause, or reactivate customer websites. The backup link is admin-only for troubleshooting.</p>
                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>Website</th><th>Email</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{filtered.map((s) => (
                      <tr key={s.slug}>
                        <td><strong>{s.business_name || s.slug}</strong><br /><small>{s.slug}.cookiesdigitalcreations.com</small><br /><small>Updated: {fmtDate(s.updated_at)}</small></td>
                        <td>{s.customer_email || '—'}</td>
                        <td>{planNames[s.plan] || s.plan || 'Free Launch Page'}</td>
                        <td>{s.status || 'published'}</td>
                        <td>
                          <a className="btn dark" target="_blank" rel="noreferrer" href={siteUrl(s.slug)}>Open Site</a>{' '}
                          <a className="btn dark" target="_blank" rel="noreferrer" href={directUrl(s.slug)}>Backup Link</a>{' '}
                          <a className="btn" target="_blank" rel="noreferrer" href={`/customer/edit/${s.slug}`}>Edit</a>{' '}
                          {s.status === 'paused' ? (
                            <button className="btn" onClick={() => update(s.slug, { status: 'published' })}>Reactivate</button>
                          ) : (
                            <button className="btn danger" onClick={() => update(s.slug, { status: 'paused' })}>Pause</button>
                          )}{' '}
                          <button className="btn danger" onClick={() => confirmArchive(s)}>Archive</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === 'plans' && (
              <section style={card}>
                <h2>Plans & Status Controls</h2>
                <p>Use this when someone upgrades, cancels, buys an extra page, or needs their site paused/reactivated.</p>
                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>Website</th><th>Plan</th><th>Status</th><th>Extra Pages</th><th>Monthly Price</th><th>Save</th></tr></thead>
                    <tbody>{filtered.map((s) => (
                      <tr key={s.slug}>
                        <td><strong>{s.business_name || s.slug}</strong><br /><small>{s.slug}</small></td>
                        <td>
                          <select value={s.plan || 'free'} onChange={(e) => {
                            const plan = e.target.value;
                            patchLocal(s.slug, { plan, monthly_price: planPrices[plan] || 0 });
                          }}>
                            {Object.keys(planNames).map((p) => <option key={p} value={p}>{planNames[p]}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={s.status || 'published'} onChange={(e) => patchLocal(s.slug, { status: e.target.value })}>
                            {statuses.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td><input style={{ width: 90 }} type="number" min="0" value={s.extra_pages || 0} onChange={(e) => patchLocal(s.slug, { extra_pages: Number(e.target.value) })} /></td>
                        <td><input style={{ width: 110 }} type="number" min="0" value={s.monthly_price ?? planPrices[s.plan || 'free'] ?? 0} onChange={(e) => patchLocal(s.slug, { monthly_price: Number(e.target.value) })} /></td>
                        <td>
                          <button className="btn" onClick={() => update(s.slug, {
                            plan: s.plan || 'free',
                            status: s.status || 'published',
                            extra_pages: Number(s.extra_pages || 0),
                            monthly_price: Number(s.monthly_price ?? planPrices[s.plan || 'free'] ?? 0)
                          })}>{savingSlug === s.slug ? 'Saving...' : 'Save'}</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === 'notes' && (
              <section style={card}>
                <h2>Admin Notes</h2>
                <p>Private notes only you see. Use this for payment issues, support notes, cancellation dates, or extra-page tracking.</p>
                <div className="cardGrid oneCol">
                  {filtered.map((s) => (
                    <div className="card" key={s.slug}>
                      <h3>{s.business_name || s.slug}</h3>
                      <small>{s.customer_email || 'No email saved'} • {planNames[s.plan] || s.plan || 'Free'} • {s.status || 'published'}</small>
                      <textarea value={s.admin_notes || ''} onChange={(e) => patchLocal(s.slug, { admin_notes: e.target.value })} placeholder="Private admin note..." />
                      <button className="btn" onClick={() => update(s.slug, { admin_notes: s.admin_notes || '' })}>{savingSlug === s.slug ? 'Saving...' : 'Save Note'}</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tab === 'archived' && (
              <section style={card}>
                <h2>Archived Websites</h2>
                <p>Archived sites are hidden from public use but kept in your records. Reactivate only when you are ready for the site to go live again.</p>
                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>Website</th><th>Email</th><th>Plan</th><th>Actions</th></tr></thead>
                    <tbody>{filtered.map((s) => (
                      <tr key={s.slug}>
                        <td><strong>{s.business_name || s.slug}</strong><br /><small>{s.slug}</small></td>
                        <td>{s.customer_email || '—'}</td>
                        <td>{planNames[s.plan] || s.plan || 'Free Launch Page'}</td>
                        <td>
                          <button className="btn" onClick={() => update(s.slug, { status: 'published' })}>Reactivate</button>{' '}
                          <a className="btn dark" target="_blank" rel="noreferrer" href={directUrl(s.slug)}>Admin Backup Link</a>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === 'help' && (
              <section style={card}>
                <h2>How to use this admin dashboard</h2>
                <p><strong>Published</strong> websites open publicly. <strong>Paused</strong> websites stay in your active records but should not open publicly. Use Pause if someone cancels, payment fails, or support is needed.</p>
                <p><strong>Archived</strong> hides a site from your active dashboard while keeping the record. This is safer than permanent deletion.</p>
                <p><strong>Plan</strong> controls what the customer should have: Free, Starter Pro, Business, or Premium.</p>
                <p><strong>Extra Pages</strong> should match how many $10/month extra page add-ons they purchased.</p>
                <p><strong>Admin Notes</strong> are private notes for you only.</p>
                <p>Until Gumroad webhooks are connected, plan changes and cancellations are handled manually here.</p>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
