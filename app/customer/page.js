'use client';

import { useEffect, useState } from 'react';
import Nav from '../../lib/Nav';

const ROOT = 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';

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
  const [browserDrafts, setBrowserDrafts] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setBrowserDraft(JSON.parse(raw));
      const index = JSON.parse(localStorage.getItem(DRAFTS_INDEX_KEY) || '{}');
      const list = Object.entries(index).map(([slug, draft]) => ({ slug, draft })).sort((a, b) => String(b.draft?.updatedAt || '').localeCompare(String(a.draft?.updatedAt || '')));
      setBrowserDrafts(list);
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

  function continueBrowserDraft(draft) {
    try {
      if (draft) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    } catch {}
    window.location.href = '/builder?restore=1';
  }

  const shownBrowserDrafts = browserDrafts.filter(item => !sites.some(site => site.slug === item.slug));

  return (
    <>
      <Nav />
      <main className="wrap customerHub">
        <section className="dashboard">
          <span className="kicker">My Website</span>
          <h1>Customer Dashboard</h1>
          <p>Find your published websites and saved drafts in one place. You can search with only your email, only the short website name, or the full subdomain link.</p>
          <div className="customerSearchTips">
            <div><strong>Email only</strong><span>Best option if you forgot the website name.</span></div>
            <div><strong>Website name</strong><span>Use the short name, like cookies-kitchen.</span></div>
            <div><strong>Full link</strong><span>Paste the whole subdomain if you have it.</span></div>
          </div>
          <div className="row">
            <div className="field">
              <label>Email, optional but recommended</label>
              <input placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Website name or subdomain, optional</label>
              <input placeholder="cookies-kitchen-digital-recipes or full website link" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          {query && <div className="notice smallNotice">We will search for: <strong>{normalizeSubdomain(query) || 'enter a website name'}</strong></div>}
          {msg && <div className={`notice ${msg.includes('failed') || msg.includes('No websites') || msg.includes('Enter') ? 'error' : ''}`}>{msg}</div>}
          <div className="navRow">
            <button className="btn" onClick={findSites} disabled={loading}>{loading ? 'Searching...' : 'Find My Websites / Drafts'}</button>
            <a className="btn dark" href="/builder">Start New Website</a>
            {browserDraft && <button className="btn dark" onClick={() => continueBrowserDraft(browserDraft)}>Continue Last Browser Draft</button>}
          </div>
        </section>

        <section className="dashboard savedBox">
          <h2>Saved Websites & Drafts</h2>
          <p className="mutedText">Published sites and saved drafts show in one box. Use Continue Draft to keep building, Open Website to view a live site, or Edit Published Site to update one that is already published.</p>
          {sites.length === 0 ? (
            <div className="emptyState"><strong>No saved websites are showing yet.</strong><br/>Search by email first. If nothing appears, check the spelling or start a new website. Browser draft backups may appear below when available.</div>
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
          {shownBrowserDrafts.length > 0 && (
            <div className="browserDraftBox">
              <h3>Browser Draft Backups</h3>
              <p className="mutedText">These are drafts saved in this browser. Use them if an online draft has not appeared yet.</p>
              <div className="savedSiteList">
                {shownBrowserDrafts.map(({ slug, draft }) => (
                  <article className="savedSiteCard" key={`browser-${slug}`}>
                    <div>
                      <span className="statusPill draft">Browser Draft</span>
                      <h3>{draft.businessName || draft.draftName || slug}</h3>
                      <p><strong>Draft address:</strong> {slug}.{ROOT}</p>
                      <p><strong>Email:</strong> {draft.customerEmail || 'Not saved'}</p>
                      {draft.updatedAt && <p className="mutedText">Saved in this browser: {new Date(draft.updatedAt).toLocaleString()}</p>}
                    </div>
                    <div className="savedActions">
                      <button className="btn dark" onClick={() => continueBrowserDraft(draft)}>Continue Browser Draft</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
