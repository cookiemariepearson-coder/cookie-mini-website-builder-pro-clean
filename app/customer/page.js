'use client';

import { useEffect, useState } from 'react';
import Nav from '../../lib/Nav';

const ROOT = 'cookiesdigitalcreations.com';

function normalizeSubdomain(input = '') {
  let value = String(input || '').trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
  value = value.split('/')[0].split('?')[0].split('#')[0];
  if (value.endsWith('.' + ROOT)) value = value.slice(0, -1 * (ROOT.length + 1));
  if (value === ROOT) value = '';
  return value.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function statusLabel(status = '') {
  const s = String(status || 'draft').toLowerCase();
  if (s === 'published') return 'Published';
  if (s === 'paused') return 'Paused';
  if (s === 'archived') return 'Archived';
  return 'Draft';
}

export default function Customer() {
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState('');
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [browserDraft, setBrowserDraft] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cookieDraftSite');
      if (raw) setBrowserDraft(JSON.parse(raw));
    } catch {}
  }, []);

  async function findSites() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanSlug = normalizeSubdomain(query);
    if (!cleanEmail && !cleanSlug) {
      setMsg('Enter your email address or website name/subdomain. You can use just the name, like cookies-kitchen-digital-recipes, or the full link.');
      setSites([]);
      return;
    }
    setLoading(true);
    setMsg('Searching for your websites and drafts...');
    try {
      const res = await fetch('/api/site/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, query: cleanSlug })
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || 'Could not find websites.');
        setSites([]);
      } else if (!data.sites?.length) {
        setMsg('No websites or drafts found yet. Check the email/subdomain spelling, or open the builder to start a new one.');
        setSites([]);
      } else {
        setSites(data.sites);
        setMsg(`${data.sites.length} saved website/draft record(s) found.`);
      }
    } catch (e) {
      setMsg(`Search failed: ${e.message}`);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }

  function continueBrowserDraft() {
    window.location.href = '/builder?restore=1';
  }

  return (
    <>
      <Nav />
      <main className="wrap customerHub">
        <section className="dashboard">
          <span className="kicker">My Website</span>
          <h1>Customer Dashboard</h1>
          <p>Find your published websites and saved drafts in one place. Search by email, by website name, or by the full subdomain link.</p>
          <div className="row">
            <div className="field">
              <label>Email</label>
              <input placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Website name or subdomain</label>
              <input placeholder="cookies-kitchen-digital-recipes or full website link" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          {query && <div className="notice smallNotice">We will search for: <strong>{normalizeSubdomain(query) || 'enter a website name'}</strong></div>}
          {msg && <div className={`notice ${msg.includes('failed') || msg.includes('No websites') || msg.includes('Enter') ? 'error' : ''}`}>{msg}</div>}
          <div className="navRow">
            <button className="btn" onClick={findSites} disabled={loading}>{loading ? 'Searching...' : 'Find My Websites / Drafts'}</button>
            <a className="btn dark" href="/builder">Start New Website</a>
            {browserDraft && <button className="btn dark" onClick={continueBrowserDraft}>Continue Last Browser Draft</button>}
          </div>
        </section>

        <section className="dashboard savedBox">
          <h2>Saved Websites & Drafts</h2>
          <p className="mutedText">Published sites and saved drafts will show here together. Drafts open back inside the builder so customers can continue where they left off.</p>
          {sites.length === 0 ? (
            <div className="emptyState">No saved websites are showing yet. Search by email or website name to load them.</div>
          ) : (
            <div className="savedSiteList">
              {sites.map(row => {
                const status = statusLabel(row.status);
                const isPublished = String(row.status || '').toLowerCase() === 'published';
                const liveUrl = `https://${row.slug}.${ROOT}`;
                return (
                  <article className="savedSiteCard" key={row.slug}>
                    <div>
                      <span className={`statusPill ${String(row.status || 'draft').toLowerCase()}`}>{status}</span>
                      <h3>{row.business_name || row.site?.businessName || row.slug}</h3>
                      <p><strong>Subdomain:</strong> {row.slug}.{ROOT}</p>
                      <p><strong>Email:</strong> {row.customer_email || row.site?.customerEmail || 'Not saved'}</p>
                      <p><strong>Plan:</strong> {row.plan || 'free'} {row.monthly_price ? `• $${row.monthly_price}/mo` : ''}</p>
                      {row.updated_at && <p className="mutedText">Last saved: {new Date(row.updated_at).toLocaleString()}</p>}
                    </div>
                    <div className="savedActions">
                      {isPublished && <a className="btn" href={liveUrl} target="_blank" rel="noreferrer">Open Website</a>}
                      {isPublished && <a className="btn dark" href={`/customer/edit/${row.slug}?email=${encodeURIComponent(row.customer_email || '')}`}>Edit Published Site</a>}
                      <a className="btn dark" href={`/builder?draft=${encodeURIComponent(row.slug)}`}>{isPublished ? 'Use as Draft / Update' : 'Continue Draft'}</a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
