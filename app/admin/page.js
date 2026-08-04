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
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [sites, setSites] = useState([]);
  const [msg, setMsg] = useState('Sign in with your authorized owner email to open the admin dashboard.');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('websites');
  const [loading, setLoading] = useState(false);
  const [savingSlug, setSavingSlug] = useState('');
  const [savedNoteSlug, setSavedNoteSlug] = useState('');

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    setLoading(true);
    setMsg('Checking your secure owner session...');
    try {
      const r = await fetch('/api/admin/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      const d = await r.json();
      if (d.ok) {
        setSites(d.sites || []);
        setUnlocked(true);
        setMsg('Admin Plan Management v2 loaded. Use the tabs below to manage websites, plans, notes, and archived sites.');
      } else {
        setUnlocked(false);
        setSites([]);
        setMsg(d.error || 'Owner sign-in required.');
      }
    } catch (e) {
      setUnlocked(false);
      setSites([]);
      setMsg(e.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  async function requestOwnerLink() {
    setLoading(true);
    const r = await fetch('/api/auth/admin/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const d = await r.json();
    setMsg(d.message || d.error || 'Unable to send the secure owner link.');
    setLoading(false);
  }

  async function lockAdmin() {
    await fetch('/api/auth/admin/session', { method: 'DELETE' });
    setUnlocked(false);
    setSites([]);
    setSearch('');
    setTab('websites');
    setMsg('Admin dashboard locked. Request a secure owner email link to reopen it.');
  }

  async function update(slug, updates, quiet = false) {
    if (!unlocked) {
      setMsg('Admin is locked. Sign in with your owner email first.');
      return;
    }
    setSavingSlug(slug);
    try {
      const r = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, updates })
      });
      const d = await r.json();
      if (d.ok) {
        if (!quiet) setMsg(updates?.admin_notes !== undefined
          ? `Private note saved in this website's database record at ${new Date().toLocaleTimeString()}.`
          : 'Saved admin change.');
        if (updates?.admin_notes !== undefined) setSavedNoteSlug(slug);
        await loadAdmin();
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

  function openOwnerEditor(site) {
    const name = site.business_name || site.slug;
    const approved = window.confirm(
      `Owner/Admin Access Notice\n\nYou are opening ${name} as the platform owner/admin. Access should only be used for authorized support, maintenance, security, policy enforcement, or changes requested by the customer. Administrative changes may be recorded.\n\nContinue to the editor?`
    );
    if (!approved) return;
    const email = encodeURIComponent(site.customer_email || '');
    window.open(`/customer/edit/${site.slug}?email=${email}`, '_blank', 'noopener,noreferrer');
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
      <main className="wrap dashboard adminWarmPage">
        <section className="adminWarmHero">
          <div>
            <span className="kicker">Owner dashboard</span>
            <h1>Admin Plan Management</h1>
            <p>This private workspace keeps customer websites, plans, notes, revenue estimates, and access controls organized in one place.</p>
          </div>
          <div className="adminHeroBadge" aria-hidden="true"><span>✦</span><strong>Cookie</strong><small>Owner Workspace</small></div>
        </section>

        <nav className="adminQuickLinks" aria-label="Admin tools">
          <a href="/admin">Website Management</a>
          <a href="/admin/subscriptions">Subscriptions &amp; Access</a>
          <a href="/admin/video-credits">AI Video Credits</a>
          <a href="/customer">Customer Dashboard</a>
        </nav>

        {!unlocked && (
          <>
            <section className="adminPanel adminPinPanel" style={card}>
              <form onSubmit={(e) => { e.preventDefault(); requestOwnerLink(); }}>
                <div className="row">
                  <div className="field">
                    <label>Authorized owner email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="field">
                    <label>&nbsp;</label>
                    <button className="btn" type="submit">{loading ? 'Sending...' : 'Email Secure Sign-In Link'}</button>
                  </div>
                </div>
              </form>
              {msg && pinMessage(msg)}
            </section>
            <section className="adminPanel adminLockedPanel" style={{ ...card, background: '#fff8ef' }}>
              <h2 style={{ marginTop: 0 }}>Admin dashboard is locked</h2>
              <p>Customer records, revenue totals, plan controls, private notes, and archived sites stay hidden until an authorized owner completes secure email verification.</p>
            </section>
          </>
        )}

        {unlocked && (
          <>
            <section className="adminPanel adminUnlockedPanel" style={card}>
              <div className="row" style={{ alignItems: 'center' }}>
                <div>
                  <h2 style={{ marginTop: 0 }}>Admin dashboard unlocked</h2>
                  <p style={{ marginBottom: 0 }}>Your verified owner session is active. Use the tabs below to manage customer websites.</p>
                </div>
                <button className="btn dark" onClick={() => loadAdmin()}>{loading ? 'Refreshing...' : 'Refresh Admin'}</button>
                <button className="btn danger" onClick={lockAdmin}>Lock Admin</button>
              </div>
              {msg && pinMessage(msg)}
            </section>

            <section className="adminPanel adminSectionsPanel" style={{ ...card, background: '#f7f1ff' }}>
              <h2 style={{ marginTop: 0 }}>Admin Sections</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={tabBtn(tab === 'websites')} onClick={() => setTab('websites')}>1. Websites</button>
                <button style={tabBtn(tab === 'plans')} onClick={() => setTab('plans')}>2. Plans & Status</button>
                <button style={tabBtn(tab === 'notes')} onClick={() => setTab('notes')}>3. Admin Notes</button>
                <button style={tabBtn(tab === 'archived')} onClick={() => setTab('archived')}>4. Archived</button>
                <button style={tabBtn(tab === 'activity')} onClick={() => setTab('activity')}>5. Recent Activity</button>
                <button style={tabBtn(tab === 'help')} onClick={() => setTab('help')}>6. How to Use</button>
              </div>
            </section>

            <div className="cardGrid adminStatsGrid">
              <div className="card"><strong>Active Sites</strong><div className="price">{stats.total}</div></div>
              <div className="card"><strong>Published</strong><div className="price">{stats.published}</div></div>
              <div className="card"><strong>Paused</strong><div className="price">{stats.paused}</div></div>
              <div className="card"><strong>Free Sites</strong><div className="price">{stats.free}</div></div>
              <div className="card"><strong>Archived</strong><div className="price">{stats.archived}</div></div>
              <div className="card"><strong>Estimated Active MRR</strong><div className="price">${stats.mrr}/mo</div></div>
            </div>

            <section className="adminPanel adminSearchPanel" style={card}>
              <div className="row">
                <h2 style={{ margin: 0 }}>
                  {tab === 'websites' && 'Websites'}
                  {tab === 'plans' && 'Plans & Status'}
                  {tab === 'notes' && 'Admin Notes'}
                  {tab === 'archived' && 'Archived Websites'}
                  {tab === 'activity' && 'Recent Activity'}
                  {tab === 'help' && 'How to Use'}
                </h2>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, slug, email, plan, status, or note" />
              </div>
            </section>

            {tab === 'websites' && (
              <section className="adminPanel adminDataPanel" style={card}>
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
                          {(s.status || 'published') === 'published' && <><a className="btn dark" target="_blank" rel="noreferrer" href={siteUrl(s.slug)}>Open Live Site</a>{' '}<a className="btn dark" target="_blank" rel="noreferrer" href={directUrl(s.slug)}>Backup Link</a>{' '}</>}
                          <button className="btn" type="button" onClick={() => openOwnerEditor(s)}>{(s.status || 'published') === 'draft' ? 'Edit Draft as Owner' : 'Edit as Owner'}</button>{' '}
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
              <section className="adminPanel adminDataPanel" style={card}>
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
              <section className="adminPanel adminDataPanel" style={card}>
                <h2>Admin Notes</h2>
                <p>Private notes only you see. Each note is stored in that website's <code>admin_notes</code> database record and appears here again whenever you open Admin Notes.</p>
                <div className="cardGrid oneCol">
                  {filtered.map((s) => (
                    <div className="card" key={s.slug}>
                      <h3>{s.business_name || s.slug}</h3>
                      <small>{s.customer_email || 'No email saved'} • {planNames[s.plan] || s.plan || 'Free'} • {s.status || 'published'}</small>
                      <textarea value={s.admin_notes || ''} onChange={(e) => patchLocal(s.slug, { admin_notes: e.target.value })} placeholder="Private admin note..." />
                      <button className="btn" onClick={() => update(s.slug, { admin_notes: s.admin_notes || '' })}>{savingSlug === s.slug ? 'Saving...' : 'Save Note'}</button>
                      {savedNoteSlug === s.slug && savingSlug !== s.slug && <p className="notice" role="status">✓ Saved privately with {s.business_name || s.slug}. It will remain in this Admin Notes section.</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tab === 'archived' && (
              <section className="adminPanel adminDataPanel" style={card}>
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

            {tab === 'activity' && (
              <section className="adminPanel adminDataPanel" style={card}>
                <h2>Recent Website Activity</h2>
                <p>The newest saved drafts, publications, and owner changes appear first. Email alerts can also be enabled with the three notification settings shown below.</p>
                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>When</th><th>Website</th><th>Customer</th><th>Current event/status</th><th>Owner action</th></tr></thead>
                    <tbody>{[...filtered].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)).map((s) => (
                      <tr key={s.slug}>
                        <td>{fmtDate(s.updated_at)}</td>
                        <td><strong>{s.business_name || s.slug}</strong><br /><small>{s.slug}</small></td>
                        <td>{s.customer_email || 'No email supplied'}</td>
                        <td>{s.status === 'draft' ? 'Draft saved or updated' : s.status === 'published' ? 'Published or updated' : `Status: ${s.status}`}</td>
                        <td><button className="btn" type="button" onClick={() => openOwnerEditor(s)}>Edit as Owner</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="notice"><strong>To turn on email alerts in Vercel, add:</strong><br /><code>RESEND_API_KEY</code><br /><code>ADMIN_NOTIFICATION_EMAIL</code><br /><code>ADMIN_NOTIFICATION_FROM_EMAIL</code></div>
              </section>
            )}

            {tab === 'help' && (
              <section className="adminPanel adminHelpPanel" style={card}>
                <h2>How to use this admin dashboard</h2>
                <p><strong>Published</strong> websites open publicly. <strong>Paused</strong> websites stay in your active records but should not open publicly. Use Pause if someone cancels, payment fails, or support is needed.</p>
                <p><strong>Archived</strong> hides a site from your active dashboard while keeping the record. This is safer than permanent deletion.</p>
                <p><strong>Plan</strong> controls what the customer should have: Free, Starter Pro, Business, or Premium.</p>
                <p><strong>Extra Pages</strong> should match how many $10/month extra page add-ons they purchased.</p>
                <p><strong>Admin Notes</strong> are private notes for you only.</p>
                <div className="notice"><strong>Owner/Admin Access Notice:</strong> Cookie Digital Creations may access a customer website only for authorized support, maintenance, security, policy enforcement, or changes requested by the customer. Do not change customer wording, prices, or business information without authorization unless action is necessary for security, legal compliance, or enforcement of an agreed platform policy.</div>
                <p>Until Gumroad webhooks are connected, plan changes and cancellations are handled manually here.</p>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
