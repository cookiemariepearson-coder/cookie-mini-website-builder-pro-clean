'use client';

import { useEffect, useState } from 'react';
import Nav from '../../lib/Nav';

const ROOT = 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';
const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';

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

function effectiveStatus(site = {}) {
  const access = String(site.access_status || '').toLowerCase();
  if (access === 'archived') return 'archived';
  if (access === 'paused') return 'paused';
  return String(site.status || 'draft').toLowerCase();
}

export default function Customer() {
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState('');
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [browserDraft, setBrowserDraft] = useState(null);
  const [browserDrafts, setBrowserDrafts] = useState([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [linkSending, setLinkSending] = useState(false);

  useEffect(() => {
    async function restoreSecureSession() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/site-owner/session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) {
          setVerifiedEmail(data.email);
          setEmail(data.email);
          if (new URLSearchParams(window.location.search).get('verified') === '1') {
            setMsg('Email verified. You can now find and manage websites saved with this email.');
          }
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch {}
      setAuthLoading(false);
    }

    restoreSecureSession();

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setBrowserDraft(JSON.parse(raw));
      const index = JSON.parse(localStorage.getItem(DRAFTS_INDEX_KEY) || '{}');
      const list = Object.entries(index).map(([slug, draft]) => ({ slug, draft })).sort((a, b) => String(b.draft?.updatedAt || '').localeCompare(String(a.draft?.updatedAt || '')));
      setBrowserDrafts(list);
    } catch {}
  }, []);

  useEffect(() => {
    if (!verifiedEmail) return;
    const shortSearch = normalizeSubdomain(query);
    if (shortSearch.length < 2) return;
    const timer = setTimeout(() => findSites(true), 450);
    return () => clearTimeout(timer);
  }, [query, verifiedEmail]);

  function secureHeaders() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async function requestSecureLink() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMsg('Enter your email address so we can send your secure sign-in link.');
      return;
    }
    setLinkSending(true);
    setMsg('Sending your secure sign-in link...');
    try {
      const returnPath = new URLSearchParams(window.location.search).get('return') === 'builder' ? '/builder' : '/customer';
      const res = await fetch('/api/auth/site-owner/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, returnPath })
      });
      const data = await res.json();
      setMsg(data.ok ? data.message : (data.error || 'The secure email link could not be sent.'));
    } catch (error) {
      setMsg(`The secure email link could not be sent: ${error.message}`);
    } finally {
      setLinkSending(false);
    }
  }

  function signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setVerifiedEmail('');
    setSites([]);
    setMsg('Signed out securely.');
  }

  async function findSites(liveSearch = false) {
    if (!verifiedEmail) {
      setMsg('Verify your email before searching for saved websites.');
      return;
    }
    const cleanEmail = verifiedEmail;
    const cleanSlug = normalizeSubdomain(query);
    if (!cleanEmail && !cleanSlug) {
      setMsg('Enter your email address or website name/subdomain. You can use just the name, like cookies-kitchen-digital-recipes, or the full link.');
      setSites([]);
      return;
    }
    setLoading(true);
    setSavedOpen(true);
    setMsg(liveSearch ? 'Filtering saved websites as you type...' : 'Searching for your websites and drafts...');
    try {
      const res = await fetch('/api/site/search', {
        method: 'POST',
        headers: secureHeaders(),
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
        setSavedOpen(true);
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

  const searchTerm = normalizeSubdomain(query);
  const matchesWords = (value = '') => !searchTerm || normalizeSubdomain(value).includes(searchTerm);
  const visibleSites = sites.filter(site => {
    const status = effectiveStatus(site);
    const matchesStatus = statusFilter === 'all' || statusFilter === status || (statusFilter === 'published' && status === 'live');
    return matchesStatus && (matchesWords(site.slug) || matchesWords(site.business_name) || matchesWords(site.site?.businessName));
  });
  const shownBrowserDrafts = browserDrafts.filter(item => {
    if (sites.some(site => site.slug === item.slug)) return false;
    if (!['all', 'draft', 'browser'].includes(statusFilter)) return false;
    return matchesWords(item.slug) || matchesWords(item.draft?.businessName) || matchesWords(item.draft?.draftName);
  });

  return (
    <>
      <Nav />
      <main className="wrap customerHub customerHubWarm">
        <section className="dashboard customerWelcome">
          <span className="kicker">My Website</span>
          <h1>Customer Dashboard</h1>
          <p>Find your published websites and saved drafts in one place. Type only a few letters or words from the website name and matching results will appear as you type.</p>
          <div className="customerSearchTips">
            <div><strong>Email only</strong><span>Best option if you forgot the website name.</span></div>
            <div><strong>A few words</strong><span>Type any part you remember, like kitchen or tadda.</span></div>
            <div><strong>Full link</strong><span>Paste the whole subdomain if you have it.</span></div>
          </div>
          <div className="notice success">
            <strong>Secure customer access</strong><br />
            {authLoading ? (
              <span>Checking your secure session...</span>
            ) : verifiedEmail ? (
              <>
                <span>Verified as {verifiedEmail}. Only websites saved with this email can be managed.</span>
                <div className="navRow"><button className="btn light" type="button" onClick={signOut}>Sign Out</button></div>
              </>
            ) : (
              <>
                <span>Enter your email below and request a secure sign-in link before searching, editing, saving, or republishing.</span>
                <div className="navRow">
                  <button className="btn" type="button" onClick={requestSecureLink} disabled={linkSending}>
                    {linkSending ? 'Sending Link...' : 'Email My Secure Sign-In Link'}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="row">
            <div className="field">
              <label>Email, optional but recommended</label>
              <input placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={Boolean(verifiedEmail)} />
            </div>
            <div className="field">
              <label>Type a few letters, words, or the website link</label>
              <input placeholder="Example: kitchen, tadda, or the full link" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
            </div>
          </div>
          {query && <div className="notice smallNotice">We will search for: <strong>{normalizeSubdomain(query) || 'enter a website name'}</strong></div>}
          {msg && <div className={`notice ${msg.includes('failed') || msg.includes('No websites') || msg.includes('Enter') ? 'error' : ''}`}>{msg}</div>}
          <div className="navRow">
            <button className="btn" onClick={findSites} disabled={loading || !verifiedEmail}>{loading ? 'Searching...' : 'Find My Websites / Drafts'}</button>
            <a className="btn dark" href="/builder">Start New Website</a>
            {browserDraft && <button className="btn dark" onClick={() => continueBrowserDraft(browserDraft)}>Continue Last Browser Draft</button>}
          </div>
        </section>

        <details className="savedDropdown" open={savedOpen} onToggle={event => setSavedOpen(event.currentTarget.open)}>
          <summary>Saved Websites &amp; Drafts</summary>
          <div className="savedDropdownContent">
          <p className="savedDropdownIntro">Published sites and saved drafts show here. Use Continue Draft to keep building, Open Website to view a live site, or Edit Published Site to update one that is already published.</p>
          <div className="savedWebsitePicker field">
            <label>Filter websites by status</label>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="all">All websites and drafts</option>
              <option value="draft">Drafts</option>
              <option value="published">Live / Published websites</option>
              <option value="paused">Paused websites</option>
              <option value="archived">Archived websites</option>
              <option value="browser">Browser draft backups</option>
            </select>
          </div>
          {visibleSites.length === 0 ? (
            <div className="emptyState"><strong>No online websites match this search and filter.</strong><br/>Try fewer letters, select All, search by email, or check the browser draft backups below.</div>
          ) : (
            <div className="savedSiteList">
              {visibleSites.map(row => {
                const currentStatus = effectiveStatus(row);
                const status = statusLabel(currentStatus);
                const isPublished = currentStatus === 'published';
                const isUnavailable = currentStatus === 'paused' || currentStatus === 'archived';
                const liveUrl = `https://${row.slug}.${ROOT}`;
                return (
                  <article className="savedSiteCard" key={row.slug}>
                    <div>
                      <span className={`statusPill ${currentStatus}`}>{status}</span>
                      <h3>{row.business_name || row.site?.businessName || row.slug}</h3>
                      <p><strong>Subdomain:</strong> {row.slug}.{ROOT}</p>
                      <p><strong>Email:</strong> {row.customer_email || row.site?.customerEmail || 'Not saved'}</p>
                      <p><strong>Plan:</strong> {row.plan || 'free'} {row.monthly_price ? `• $${row.monthly_price}/mo` : ''}</p>
                      {row.updated_at && <p className="mutedText">Last saved: {new Date(row.updated_at).toLocaleString()}</p>}
                    </div>
                    <div className="savedActions">
                      {isPublished && <a className="btn" href={liveUrl} target="_blank" rel="noreferrer">Open Website</a>}
                      {isPublished && <a className="btn dark" href={`/customer/edit/${row.slug}`}>Edit Published Site</a>}
                      {!isUnavailable && <a className="btn dark" href={`/builder?draft=${encodeURIComponent(row.slug)}`}>{isPublished ? 'Use as Draft / Update' : 'Continue Draft'}</a>}
                      {isUnavailable && <div className="notice">This website is {currentStatus}. Contact Cookie Digital Creations if access should be restored.</div>}
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
          </div>
        </details>
      </main>
    </>
  );
}
