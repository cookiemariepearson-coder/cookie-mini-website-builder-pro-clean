'use client';

import { useEffect, useRef, useState } from 'react';
import Nav from '../../lib/Nav';
import { PENDING_CHECKOUT_STORAGE_KEY, createPendingCheckoutIntent, customerReturnPath, pendingCheckoutReturnPath } from '../../lib/commerceConfig.mjs';

const ROOT = 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';
const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';
const GUEST_CLAIM_KEY = 'cookieGuestDraftClaimV1';

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
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const autoLoadedOwnerRef = useRef('');

  useEffect(() => {
    async function restoreSecureSession() {
      const params = new URLSearchParams(window.location.search);
      setAuthMode(params.get('mode') === 'create' ? 'create' : 'signin');
      const authHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const fragmentToken = authHash.get('access_token') || '';
      const fragmentError = authHash.get('error_description') || authHash.get('error') || '';
      if (fragmentToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, fragmentToken);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
      const token = fragmentToken || localStorage.getItem(AUTH_TOKEN_KEY) || '';
      const checkoutIntentId = params.get('intent') || '';
      if (!token && checkoutIntentId) {
        const draft = params.get('draft') || '';
        window.location.replace(`/checkout/continue?intent=${encodeURIComponent(checkoutIntentId)}${draft ? `&draft=${encodeURIComponent(draft)}` : ''}`);
        return;
      }
      const queryReturnPath = customerReturnPath(params.get('return'), params.get('checkout'), params.get('draft'));
      const requestedReturnPath = queryReturnPath !== '/customer'
        ? queryReturnPath
        : pendingCheckoutReturnPath(localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY));
      if (queryReturnPath.startsWith('/builder?checkout=')) {
        const intent = createPendingCheckoutIntent(params.get('checkout'), params.get('draft'));
        if (intent) localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(intent));
      }
      if (!token) {
        if (fragmentError) {
          setMsg(fragmentError);
        } else if (checkoutIntentId) {
          setMsg('Verify your email to continue the saved paid-plan checkout. Your selected plan and website are preserved.');
        } else if (requestedReturnPath !== '/customer') {
          setMsg(requestedReturnPath.startsWith('/builder')
            ? 'Verify your email to continue to the selected paid-plan checkout. Your plan and browser draft are preserved.'
            : 'Verify your email to continue to AI Video Studio with your website plan.');
        }
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/site-owner/session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) {
          const claimResult = await claimGuestDraft(token);
          setVerifiedEmail(data.email);
          setEmail(data.email);
          if (checkoutIntentId) {
            const resumeResponse = await fetch('/api/checkout/intent/resume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ intentId: checkoutIntentId })
            });
            const resumed = await resumeResponse.json();
            if (resumed.ok && resumed.builderPath) {
              localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
              window.location.replace(resumed.builderPath);
              return;
            }
            setMsg(resumed.error || 'The saved checkout could not resume. Your website draft is still safe.');
          }
          if (fragmentToken && !checkoutIntentId) {
            const activeResponse = await fetch('/api/checkout/intent/active', { headers: { Authorization: `Bearer ${token}` } });
            const active = await activeResponse.json();
            if (active.ok && active.intent?.id) {
              const resumeResponse = await fetch('/api/checkout/intent/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ intentId: active.intent.id })
              });
              const resumed = await resumeResponse.json();
              if (resumed.ok && resumed.builderPath) {
                window.location.replace(resumed.builderPath);
                return;
              }
            }
          }
          let continuationPath = requestedReturnPath;
          if (continuationPath === '/customer') {
            try {
              const continuationResponse = await fetch('/api/auth/site-owner/continuation', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const continuation = await continuationResponse.json();
              if (continuation.ok && continuation.returnPath) continuationPath = continuation.returnPath;
            } catch {}
          }
          if (continuationPath !== '/customer') {
            window.location.replace(continuationPath);
            return;
          }
          try {
            const activeResponse = await fetch('/api/checkout/intent/active', { headers: { Authorization: `Bearer ${token}` } });
            const active = await activeResponse.json();
            if (active.ok && active.intent) {
              setPendingPurchase(active.intent);
              setMsg('Your paid-plan checkout is still waiting. Choose Continue Purchase to return to the correct plan and website.');
            }
          } catch {}
          if (new URLSearchParams(window.location.search).get('verified') === '1') {
            setMsg(claimResult?.ok
              ? 'Account verified. Your browser draft is now saved permanently in My Websites.'
              : 'Email verified. My Websites is ready.');
          }
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setMsg(data.error || 'Your secure sign-in expired. Request a new email link to open My Drafts.');
        }
      } catch {
        setMsg('Your secure session could not be checked. Your drafts are still safe; please retry or request a new sign-in link.');
      }
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

  useEffect(() => {
    if (!verifiedEmail || autoLoadedOwnerRef.current === verifiedEmail) return;
    autoLoadedOwnerRef.current = verifiedEmail;
    findSites(true);
    // findSites intentionally runs once for each verified owner session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedEmail]);

  function secureHeaders() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async function ensureGuestDraftClaim() {
    let draft = null;
    let currentClaim = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      currentClaim = JSON.parse(localStorage.getItem(GUEST_CLAIM_KEY) || 'null');
    } catch {}
    if (!draft) return null;
    let response = await fetch('/api/site/guest-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: draft,
        claimId: currentClaim?.claimId || '',
        claimToken: currentClaim?.claimToken || ''
      })
    });
    if (response.status === 410 && currentClaim) {
      localStorage.removeItem(GUEST_CLAIM_KEY);
      response = await fetch('/api/site/guest-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: draft })
      });
    }
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'The browser draft could not be prepared for account transfer.');
    const claim = { claimId: result.claimId, claimToken: result.claimToken, expiresAt: result.expiresAt };
    localStorage.setItem(GUEST_CLAIM_KEY, JSON.stringify(claim));
    return claim;
  }

  async function claimGuestDraft(token) {
    let claim = null;
    try { claim = JSON.parse(localStorage.getItem(GUEST_CLAIM_KEY) || 'null'); } catch {}
    if (!claim?.claimId || !claim?.claimToken || !token) return null;
    try {
      const response = await fetch('/api/site/guest-draft/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ claimId: claim.claimId, claimToken: claim.claimToken })
      });
      const result = await response.json();
      if (result.ok) {
        localStorage.removeItem(GUEST_CLAIM_KEY);
        localStorage.setItem('cookieGuestDraftClaimedSlug', result.slug || '');
      }
      return result;
    } catch {
      return { ok: false };
    }
  }

  async function requestSecureLink() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMsg('Enter your email address so we can send your secure sign-in link.');
      return;
    }
    setLinkSending(true);
    setMsg(authMode === 'create' ? 'Preparing your browser draft and secure account link...' : 'Requesting your secure sign-in link...');
    try {
      let transferWarning = '';
      try {
        await ensureGuestDraftClaim();
      } catch {
        transferWarning = ' Your browser draft remains on this device and can be saved again after sign-in.';
      }
      const params = new URLSearchParams(window.location.search);
      const checkoutIntentId = params.get('intent') || '';
      const queryReturnPath = customerReturnPath(params.get('return'), params.get('checkout'), params.get('draft'));
      const returnPath = queryReturnPath !== '/customer'
        ? queryReturnPath
        : pendingCheckoutReturnPath(localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY));
      const res = await fetch('/api/auth/site-owner/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, returnPath, intentId: checkoutIntentId, draftSlug: params.get('draft') || '', authMode })
      });
      const data = await res.json();
      setMsg(data.ok ? `${data.message}${transferWarning}` : (data.error || 'The secure email link could not be sent.'));
    } catch (error) {
      setMsg(`The secure email link could not be sent: ${error.message}`);
    } finally {
      setLinkSending(false);
    }
  }

  async function signOut() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try {
      await fetch('/api/auth/site-owner/signout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    localStorage.removeItem(AUTH_TOKEN_KEY);
    autoLoadedOwnerRef.current = '';
    setVerifiedEmail('');
    setSites([]);
    setMsg('Signed out. Your private websites now require a new secure email link.');
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
    setMsg(liveSearch && query ? 'Filtering saved websites as you type...' : 'Loading your websites and drafts...');
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

  async function manageSite(slug, action) {
    const label = action === 'delete' ? 'permanently delete this unpublished free draft' : 'archive this website';
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    setMsg(action === 'delete' ? 'Deleting the confirmed draft…' : 'Archiving the confirmed website…');
    try {
      const response = await fetch('/api/site/manage', {
        method: 'POST',
        headers: secureHeaders(),
        body: JSON.stringify({ slug, action })
      });
      const result = await response.json();
      setMsg(result.ok ? result.message : (result.error || 'The website was not changed.'));
      if (result.ok) await findSites(true);
    } catch {
      setMsg('The website action could not be completed. Your website remains unchanged.');
    }
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
  const websiteGroups = [
    { key: 'drafts', title: 'Drafts', rows: visibleSites.filter(site => effectiveStatus(site) === 'draft') },
    { key: 'published', title: 'Published Websites', rows: visibleSites.filter(site => effectiveStatus(site) === 'published') },
    { key: 'plans', title: 'Purchases or Plans', rows: visibleSites.filter(site => ['starter', 'business', 'premium'].includes(String(site.plan || '').toLowerCase()) || Number(site.monthly_price) > 0) },
    { key: 'archived', title: 'Archived Websites', rows: visibleSites.filter(site => ['archived', 'paused'].includes(effectiveStatus(site))) }
  ].filter(group => group.rows.length > 0);

  function renderSiteCard(row, groupKey) {
    const currentStatus = effectiveStatus(row);
    const status = statusLabel(currentStatus);
    const isPublished = currentStatus === 'published';
    const isUnavailable = currentStatus === 'paused' || currentStatus === 'archived';
    const liveUrl = `https://${row.slug}.${ROOT}`;
    return (
      <article className="savedSiteCard" key={`${groupKey}-${row.slug}`}>
        <div>
          <span className={`statusPill ${currentStatus}`}>{status}</span>
          <h3>{row.business_name || row.site?.businessName || row.slug}</h3>
          <p><strong>Website:</strong> {row.slug}.{ROOT}</p>
          <p><strong>Plan:</strong> {row.plan || 'free'} {row.monthly_price ? `• $${row.monthly_price}/mo` : ''}</p>
          {row.updated_at && <p className="mutedText">Last updated: {new Date(row.updated_at).toLocaleString()}</p>}
        </div>
        <div className="savedActions">
          {isPublished && <a className="btn" href={liveUrl} target="_blank" rel="noreferrer">View Live Website</a>}
          {isPublished && <a className="btn dark" href={`/customer/edit/${row.slug}`}>Edit Website</a>}
          {!isUnavailable && <a className="btn dark" href={`/builder?draft=${encodeURIComponent(row.slug)}`}>{isPublished ? 'Preview / Republish' : 'Edit Website'}</a>}
          {!isUnavailable && <button className="btn light" type="button" onClick={() => manageSite(row.slug, 'archive')}>Archive</button>}
          {!isPublished && String(row.plan || 'free') === 'free' && <button className="btn light" type="button" onClick={() => manageSite(row.slug, 'delete')}>Delete Draft</button>}
          {isUnavailable && <div className="notice">This website is {currentStatus}. Contact Cookie Digital Creations if access should be restored.</div>}
        </div>
      </article>
    );
  }

  return (
    <>
      <Nav />
      <main className="wrap customerHub customerHubWarm">
        <section className="dashboard customerWelcome">
          <span className="kicker">Cookie Mini Website Builder Pro</span>
          <h1>My Websites</h1>
          <p>Open your customer-owned drafts, published websites, purchases, and publishing controls in one secure place.</p>
          <div className="customerSearchTips">
            <div><strong>Email only</strong><span>Use the email that owns the website.</span></div>
            <div><strong>A few words</strong><span>Type any part you remember, like kitchen or tadda.</span></div>
            <div><strong>Full link</strong><span>Paste the whole subdomain if you have it.</span></div>
          </div>
          <div className="notice success">
            <strong>{verifiedEmail ? 'Secure customer access' : authMode === 'create' ? 'Create Free Account' : 'Sign In'}</strong><br />
            {authLoading ? (
              <span>Checking your secure session...</span>
            ) : verifiedEmail ? (
              <>
                <span>Verified as {verifiedEmail}. Only websites saved with this email can be managed.</span>
                <div className="navRow"><button className="btn light" type="button" onClick={signOut}>Sign Out</button></div>
              </>
            ) : (
              <>
                <span>{authMode === 'create'
                  ? 'Create your free account to save your website, reopen it later, access it from another device, purchase a plan, and publish when you’re ready.'
                  : 'Sign in securely to open your saved websites, drafts, purchases, and publishing controls.'}</span>
                <div className="authChoiceRow" aria-label="Choose account access">
                  <a className={`btn ${authMode === 'signin' ? '' : 'light'}`} href="/customer?mode=signin">Sign In</a>
                  <a className={`btn ${authMode === 'create' ? '' : 'light'}`} href="/customer?mode=create">Create Free Account</a>
                </div>
                <div className="navRow">
                  <button className="btn" type="button" onClick={requestSecureLink} disabled={linkSending}>
                    {linkSending
                      ? 'Requesting Secure Link...'
                      : authMode === 'create' ? 'Email My Secure Account Link' : 'Email My Secure Sign-In Link'}
                  </button>
                </div>
                <p className="mutedText">Secure links are temporary and one-time use. If you entered the wrong email, correct it below before requesting another link.</p>
              </>
            )}
          </div>
          {pendingPurchase && (
            <div className="notice" data-testid="continue-purchase">
              <strong>Complete your saved purchase</strong><br />
              Your {pendingPurchase.plan === 'starter' ? 'Starter Pro' : pendingPurchase.plan === 'business' ? 'Business' : pendingPurchase.plan === 'premium' ? 'Premium' : 'Extra Page Add-On'} checkout is still waiting for {pendingPurchase.draftSlug || 'your saved website'}.
              <div className="navRow"><a className="btn" href={pendingPurchase.builderPath}>Continue Purchase</a></div>
            </div>
          )}
          <div className="row">
            <div className="field">
              <label htmlFor="customer-auth-email">{authMode === 'create' ? 'Email for your free account' : 'Account email'}</label>
              <input id="customer-auth-email" type="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={Boolean(verifiedEmail)} />
            </div>
            <div className="field">
              <label>Type a few letters, words, or the website link</label>
              <input placeholder="Example: kitchen, tadda, or the full link" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
            </div>
          </div>
          {query && <div className="notice smallNotice">We will search for: <strong>{normalizeSubdomain(query) || 'enter a website name'}</strong></div>}
          {msg && <div role="status" aria-live="polite" className={`notice ${msg.includes('failed') || msg.includes('No websites') || msg.includes('Enter') ? 'error' : ''}`}>{msg}</div>}
          <div className="navRow">
            <button className="btn" onClick={findSites} disabled={loading || !verifiedEmail}>{loading ? 'Loading My Websites...' : 'Refresh My Websites'}</button>
            <a className="btn dark" href="/builder">Start New Website</a>
            {verifiedEmail && <a className="btn light" href="/customer/account">Account</a>}
            {browserDraft && <button className="btn dark" onClick={() => continueBrowserDraft(browserDraft)}>Continue Last Browser Draft</button>}
          </div>
        </section>

        <details className="savedDropdown" open={savedOpen} onToggle={event => setSavedOpen(event.currentTarget.open)}>
          <summary>My Websites</summary>
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
            <div className="emptyState"><strong>You do not have any saved websites matching this view.</strong><br/>Start building your first website, try fewer search words, or check the browser draft backups below.</div>
          ) : (
            <div className="myWebsiteGroups">
              {websiteGroups.map(group => (
                <section className="websiteGroup" aria-labelledby={`website-group-${group.key}`} key={group.key}>
                  <h3 id={`website-group-${group.key}`}>{group.title}</h3>
                  <div className="savedSiteList">{group.rows.map(row => renderSiteCard(row, group.key))}</div>
                </section>
              ))}
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
