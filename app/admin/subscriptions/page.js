'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../../../lib/Nav';

const subscriptionOptions = ['active', 'unverified', 'canceled', 'ended', 'refunded', 'disputed', 'paused'];
const accessOptions = ['active', 'paused', 'archived'];
const siteStatusOptions = ['published', 'paused', 'draft', 'archived'];
const planOptions = ['free', 'starter', 'business', 'premium'];

const cardStyle = {
  border: '1px solid rgba(32,23,47,.12)',
  borderRadius: 22,
  padding: 18,
  background: 'rgba(255,255,255,.95)',
  boxShadow: '0 18px 45px rgba(32,23,47,.08)',
  overflow: 'hidden'
};

function pill(status) {
  const s = String(status || 'unverified');
  const color = ['active', 'published'].includes(s)
    ? '#147d43'
    : ['paused', 'canceled', 'ended', 'refunded', 'disputed', 'archived'].includes(s)
      ? '#a12d2d'
      : '#8a6500';
  return <span style={{ background: color, color: 'white', padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 800, display: 'inline-block' }}>{s}</span>;
}

function formatDate(date) {
  try { return date ? new Date(date).toLocaleString() : '—'; } catch { return '—'; }
}

function siteTitle(w) {
  return w.businessName || w.business_name || w.slug || 'Untitled website';
}

function siteEmail(w) {
  return w.customer_email || w.email || w.gumroad_email || '';
}

function isArchived(w) {
  return w.access_status === 'archived' || w.status === 'archived';
}

function compareSites(a, b, sortBy) {
  const nameA = siteTitle(a).toLowerCase();
  const nameB = siteTitle(b).toLowerCase();
  const dateA = new Date(a.updated_at || 0).getTime();
  const dateB = new Date(b.updated_at || 0).getTime();
  if (sortBy === 'name_az') return nameA.localeCompare(nameB);
  if (sortBy === 'name_za') return nameB.localeCompare(nameA);
  if (sortBy === 'plan') return String(a.plan || '').localeCompare(String(b.plan || '')) || nameA.localeCompare(nameB);
  if (sortBy === 'status') return String(a.status || '').localeCompare(String(b.status || '')) || nameA.localeCompare(nameB);
  if (sortBy === 'email') return siteEmail(a).localeCompare(siteEmail(b)) || nameA.localeCompare(nameB);
  if (sortBy === 'oldest') return dateA - dateB;
  return dateB - dateA;
}

export default function GumroadSubscriptionsAdmin() {
  const [pin, setPin] = useState('');
  const [ready, setReady] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [planFilter, setPlanFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenSlugs, setHiddenSlugs] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cookieAdminHiddenSubscriptionSites') || '[]');
      if (Array.isArray(saved)) setHiddenSlugs(saved);
    } catch {}
  }, []);

  function saveHidden(next) {
    setHiddenSlugs(next);
    try { localStorage.setItem('cookieAdminHiddenSubscriptionSites', JSON.stringify(next)); } catch {}
  }

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

  async function update(slug, updates, successMessage = 'Saved admin update.') {
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
    setMsg(successMessage);
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
  const archiveCount = websites.filter(isArchived).length;
  const unmatchedEvents = events.filter(e => !e.matched_slug).length;

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    return websites
      .filter(w => !isArchived(w))
      .filter(w => !hiddenSlugs.includes(w.slug))
      .filter(w => planFilter === 'all' || (w.plan || 'free') === planFilter)
      .filter(w => {
        if (!q) return true;
        return [siteTitle(w), w.slug, siteEmail(w), w.plan, w.status, w.subscription_status, w.access_status]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => compareSites(a, b, sortBy));
  }, [websites, search, sortBy, planFilter, hiddenSlugs]);

  const archivedSites = useMemo(() => {
    return websites
      .filter(isArchived)
      .filter(w => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [siteTitle(w), w.slug, siteEmail(w), w.plan, w.status, w.subscription_status, w.access_status]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => compareSites(a, b, sortBy));
  }, [websites, search, sortBy]);

  const hiddenSites = useMemo(() => {
    return websites
      .filter(w => hiddenSlugs.includes(w.slug) && !isArchived(w))
      .sort((a, b) => compareSites(a, b, sortBy));
  }, [websites, hiddenSlugs, sortBy]);

  function hideSite(slug) {
    if (!slug || hiddenSlugs.includes(slug)) return;
    saveHidden([...hiddenSlugs, slug]);
    setMsg('Website hidden from your active organizer view. It is not paused or archived.');
  }

  function unhideSite(slug) {
    saveHidden(hiddenSlugs.filter(x => x !== slug));
    setMsg('Website restored to your active organizer view.');
  }

  function WebsiteCard({ w, mode = 'active' }) {
    const title = siteTitle(w);
    const email = siteEmail(w) || 'No email saved';
    const slug = w.slug;
    return (
      <article style={cardStyle} className="siteManageCard">
        <div className="siteCardTop">
          <div>
            <h3 style={{ margin: '0 0 6px' }}>{title}</h3>
            <a href={`https://${slug}.cookiesdigitalcreations.com`} target="_blank" rel="noreferrer">{slug}</a>
            <p style={{ margin: '8px 0 0' }}><small>{email}</small></p>
            <p style={{ margin: '8px 0 0' }}><small>Updated: {formatDate(w.updated_at)}</small></p>
          </div>
          <div className="quickBadges">
            {pill(w.plan || 'free')}
            {pill(w.subscription_status)}
            {pill(w.access_status)}
            {pill(w.status)}
          </div>
        </div>

        <div className="siteControlsGrid">
          <div className="field compactField">
            <label>Plan</label>
            <select value={w.plan || 'free'} onChange={e => update(slug, { plan: e.target.value })}>{planOptions.map(x => <option key={x}>{x}</option>)}</select>
          </div>

          <div className="field compactField">
            <label>Subscription</label>
            <select value={w.subscription_status || 'unverified'} onChange={e => update(slug, { subscription_status: e.target.value })}>{subscriptionOptions.map(x => <option key={x}>{x}</option>)}</select>
          </div>

          <div className="field compactField">
            <label>Access</label>
            <select
              value={w.access_status || 'active'}
              onChange={e => {
                const next = e.target.value;
                update(slug, {
                  access_status: next,
                  status: next === 'active' ? 'published' : next,
                  paused_reason: next === 'paused' ? 'Paused manually by admin.' : next === 'archived' ? 'Archived manually by admin.' : ''
                }, next === 'archived' ? 'Website moved to Archive.' : 'Saved access update.');
              }}
            >{accessOptions.map(x => <option key={x}>{x}</option>)}</select>
          </div>

          <div className="field compactField">
            <label>Site Status</label>
            <select value={w.status || 'published'} onChange={e => update(slug, { status: e.target.value, access_status: e.target.value === 'archived' ? 'archived' : w.access_status })}>{siteStatusOptions.map(x => <option key={x}>{x}</option>)}</select>
          </div>
        </div>

        <div className="adminCardActions">
          <a className="smallBtn" href={`https://${slug}.cookiesdigitalcreations.com`} target="_blank" rel="noreferrer">Open Site</a>
          <button className="smallBtn" onClick={() => update(slug, { access_status: 'paused', status: 'paused', paused_reason: 'Paused manually by admin.' }, 'Website paused.')}>Pause</button>
          <button className="smallBtn" onClick={() => update(slug, { access_status: 'active', status: 'published', paused_reason: '' }, 'Website reactivated.')}>Reactivate</button>
          {mode === 'archive' ? (
            <button className="smallBtn gold" onClick={() => update(slug, { access_status: 'active', status: 'published', paused_reason: '' }, 'Website retrieved from Archive.')}>Retrieve from Archive</button>
          ) : (
            <button className="smallBtn danger" onClick={() => update(slug, { access_status: 'archived', status: 'archived', paused_reason: 'Archived manually by admin.' }, 'Website moved to Archive.')}>Archive</button>
          )}
          {mode === 'hidden' ? (
            <button className="smallBtn" onClick={() => unhideSite(slug)}>Unhide</button>
          ) : mode !== 'archive' ? (
            <button className="smallBtn" onClick={() => hideSite(slug)}>Hide from View</button>
          ) : null}
        </div>

        <div className="field compactField notesField">
          <label>Private Notes</label>
          <textarea rows={3} defaultValue={w.admin_notes || ''} onBlur={e => update(slug, { admin_notes: e.target.value }, 'Private note saved.')} placeholder="Private admin notes" />
          <small>Gumroad: {w.gumroad_product_name || 'No product yet'} / {w.gumroad_last_event || 'No event'} {w.gumroad_last_event_at ? formatDate(w.gumroad_last_event_at) : ''}</small>
        </div>
      </article>
    );
  }

  return (
    <>
      <Nav />
      <main className="wrap dashboard" style={{ maxWidth: 1260 }}>
        <span className="kicker">Owner only</span>
        <h1>Gumroad Subscription Status + Access Control</h1>
        <p>This page tracks paid website access, subscription status, Gumroad events, and archived customer sites.</p>

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
              <div><strong>{archiveCount}</strong><span>Archived</span></div>
              <div><strong>{hiddenSites.length}</strong><span>Hidden from View</span></div>
              <div><strong>{unmatchedEvents}</strong><span>Unmatched Gumroad Events</span></div>
            </div>

            <section className="card organizerPanel">
              <div className="organizerHeader">
                <div>
                  <h2>Websites & Subscription Access</h2>
                  <p className="mutedText">Archive moves websites into the Archive box below. Hide only removes a website from your current organizer view; it does not pause or archive the site.</p>
                </div>
                <div className="organizerTools">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or slug" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="newest">Sort: Newest updated</option>
                    <option value="oldest">Sort: Oldest updated</option>
                    <option value="name_az">Sort: Name A-Z</option>
                    <option value="name_za">Sort: Name Z-A</option>
                    <option value="plan">Sort: Plan</option>
                    <option value="status">Sort: Status</option>
                    <option value="email">Sort: Customer email</option>
                  </select>
                  <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
                    <option value="all">All plans</option>
                    {planOptions.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>

              <div className="sectionToggleRow">
                <button className={showArchived ? 'smallBtn' : 'smallBtn gold'} onClick={() => setShowArchived(false)}>Active Organizer ({filteredSites.length})</button>
                <button className={showArchived ? 'smallBtn gold' : 'smallBtn'} onClick={() => setShowArchived(true)}>Archive Box ({archivedSites.length})</button>
                <button className="smallBtn" onClick={() => setShowHidden(!showHidden)}>{showHidden ? 'Hide Hidden Box' : `Hidden Box (${hiddenSites.length})`}</button>
              </div>

              {!showArchived && (
                <div style={{ display: 'grid', gap: 16 }}>
                  {filteredSites.map(w => <WebsiteCard key={w.slug} w={w} />)}
                  {filteredSites.length === 0 && <div className="notice">No active websites match your search/filter. Check the Archive Box or Hidden Box.</div>}
                </div>
              )}

              {showArchived && (
                <div className="archiveBox">
                  <h3>Archive Box</h3>
                  <p>Archived sites are removed from the active organizer view. Use “Retrieve from Archive” to bring one back.</p>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {archivedSites.map(w => <WebsiteCard key={w.slug} w={w} mode="archive" />)}
                    {archivedSites.length === 0 && <div className="notice">Your Archive Box is empty.</div>}
                  </div>
                </div>
              )}

              {showHidden && (
                <div className="hiddenBox">
                  <h3>Hidden from Organizer View</h3>
                  <p>Hidden websites are still active unless you paused or archived them. This is only for your screen organization.</p>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {hiddenSites.map(w => <WebsiteCard key={w.slug} w={w} mode="hidden" />)}
                    {hiddenSites.length === 0 && <div className="notice">No websites are hidden from your organizer view.</div>}
                  </div>
                </div>
              )}
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
        .organizerHeader { display: grid; grid-template-columns: 1fr minmax(280px, 470px); gap: 18px; align-items: end; }
        .organizerTools { display: grid; gap: 10px; }
        .organizerTools input, .organizerTools select { width: 100%; padding: 13px 14px; border-radius: 14px; border: 1px solid rgba(32,23,47,.16); font-weight: 700; background: white; color: #1f1436; }
        .sectionToggleRow { display: flex; gap: 10px; flex-wrap: wrap; margin: 18px 0; }
        .archiveBox, .hiddenBox { border: 1px dashed rgba(207,109,29,.45); border-radius: 20px; padding: 18px; background: rgba(255,248,238,.72); margin-top: 18px; }
        .hiddenBox { background: rgba(242,236,255,.72); border-color: rgba(108,55,190,.35); }
        .siteCardTop { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }
        .quickBadges { display: flex; gap: 7px; flex-wrap: wrap; justify-content: flex-end; }
        .siteControlsGrid { display: grid; grid-template-columns: repeat(4, minmax(145px, 1fr)); gap: 12px; margin-top: 16px; }
        .adminCardActions { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
        .smallBtn { border: 1px solid rgba(32,23,47,.14); background: #fff; color: #20172f; border-radius: 999px; padding: 10px 14px; font-weight: 900; cursor: pointer; text-decoration: none; display: inline-block; }
        .smallBtn.gold { background: linear-gradient(135deg, #f7a828, #dc7222); color: #fff; border-color: transparent; }
        .smallBtn.danger { background: #9d2429; color: #fff; border-color: transparent; }
        .compactField { margin: 0; }
        .compactField label { display:block; font-weight: 900; margin-bottom: 6px; }
        .compactField select, .compactField textarea { width: 100%; max-width: 100%; }
        .notesField { margin-top: 8px; }
        @media (max-width: 1050px) {
          .organizerHeader { grid-template-columns: 1fr; }
          .siteCardTop { grid-template-columns: 1fr; }
          .quickBadges { justify-content: flex-start; }
          .siteControlsGrid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 650px) {
          .siteControlsGrid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
