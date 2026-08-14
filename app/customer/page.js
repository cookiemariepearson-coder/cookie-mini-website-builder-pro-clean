'use client';

import { useEffect, useRef, useState } from 'react';
import Nav from '../../lib/Nav';
import { PENDING_CHECKOUT_STORAGE_KEY, createPendingCheckoutIntent, customerReturnPath, pendingCheckoutReturnPath, safeCustomerReturnPath } from '../../lib/commerceConfig.mjs';
import { useAccountModal } from '../../components/AccountModalProvider';
import WebsiteManagementDialog from '../../components/WebsiteManagementDialog';
import { customerWebsiteStatus, websiteDisplayName } from '../../lib/customerWebsiteManagement.mjs';

const ROOT = 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';
const GUEST_CLAIM_KEY = 'cookieGuestDraftClaimV1';
const DASHBOARD_STATE_KEY = 'cookieMyWebsitesPageStateV1';

function normalizeSubdomain(input = '') {
  let value = String(input || '').trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
  value = value.split('/')[0].split('?')[0].split('#')[0];
  if (value.endsWith('.' + ROOT)) value = value.slice(0, -1 * (ROOT.length + 1));
  if (value === ROOT) value = '';
  return value.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function isWebsiteUnavailable(site = {}) {
  const status = String(site.status || '').toLowerCase();
  const access = String(site.access_status || '').toLowerCase();
  return ['paused', 'archived', 'inactive'].includes(status) || ['paused', 'archived', 'inactive'].includes(access);
}

export default function Customer() {
  const { accountState, accountEmail, openAccountModal } = useAccountModal();
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState('');
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [browserDraft, setBrowserDraft] = useState(null);
  const [browserDrafts, setBrowserDrafts] = useState([]);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [managementDialog, setManagementDialog] = useState(null);
  const [managementBusy, setManagementBusy] = useState(false);
  const [managementError, setManagementError] = useState('');
  const autoLoadedOwnerRef = useRef('');
  const statusRef = useRef(null);
  const restoredSiteRef = useRef('');

  useEffect(() => {
    async function restoreSecureSession() {
      const params = new URLSearchParams(window.location.search);
      setAuthMode(params.get('mode') === 'create' ? 'create' : 'signin');
      const checkoutIntentId = params.get('intent') || '';
      const explicitReturn = params.get('return') || '';
      const queryReturnPath = explicitReturn.startsWith('/')
        ? safeCustomerReturnPath(explicitReturn)
        : customerReturnPath(explicitReturn, params.get('checkout'), params.get('draft'));
      const requestedReturnPath = queryReturnPath !== '/customer'
        ? queryReturnPath
        : pendingCheckoutReturnPath(localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY));
      if (queryReturnPath.startsWith('/builder?checkout=')) {
        const intent = createPendingCheckoutIntent(params.get('checkout'), params.get('draft'));
        if (intent) localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(intent));
      }
      if (accountState === 'checking') return;
      if (accountState !== 'signed-in') {
        const draft = params.get('draft') || '';
        const destination = checkoutIntentId
          ? `/checkout/continue?intent=${encodeURIComponent(checkoutIntentId)}${draft ? `&draft=${encodeURIComponent(draft)}` : ''}`
          : requestedReturnPath;
        setMsg('Sign in to open My Websites. Only your own customer records will load.');
        setAuthLoading(false);
        if (params.has('mode') || checkoutIntentId || requestedReturnPath !== '/customer') {
          openAccountModal({ mode: params.get('mode') === 'create' ? 'create' : 'signin', destination });
        }
        return;
      }
      try {
        const res = await fetch('/api/auth/site-owner/session', { cache: 'no-store' });
        const data = await res.json();
        if (data.ok) {
          const claimResult = await claimGuestDraft();
          setVerifiedEmail(data.email);
          if (checkoutIntentId) {
            const resumeResponse = await fetch('/api/checkout/intent/resume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
          let continuationPath = requestedReturnPath;
          if (continuationPath === '/customer') {
            try {
              const continuationResponse = await fetch('/api/auth/site-owner/continuation', {
                cache: 'no-store'
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
            const activeResponse = await fetch('/api/checkout/intent/active');
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
          setMsg(data.error || 'Your secure sign-in expired. Sign in again to open My Websites.');
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
  }, [accountState, accountEmail, openAccountModal]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DASHBOARD_STATE_KEY) || 'null');
      if (!saved) return;
      setQuery(String(saved.query || ''));
      restoredSiteRef.current = String(saved.slug || '');
    } catch {}
  }, []);

  useEffect(() => {
    const slug = restoredSiteRef.current;
    if (!slug || !sites.length) return;
    restoredSiteRef.current = '';
    sessionStorage.removeItem(DASHBOARD_STATE_KEY);
    window.requestAnimationFrame(() => {
      document.getElementById(`website-${slug}`)?.scrollIntoView({ block: 'center' });
    });
  }, [sites]);

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
    return { 'Content-Type': 'application/json' };
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

  async function claimGuestDraft() {
    let claim = null;
    try { claim = JSON.parse(localStorage.getItem(GUEST_CLAIM_KEY) || 'null'); } catch {}
    if (!claim?.claimId || !claim?.claimToken) return null;
    try {
      const response = await fetch('/api/site/guest-draft/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async function findSites(liveSearch = false) {
    if (!verifiedEmail) {
      setMsg('Verify your email before searching for saved websites.');
      return;
    }
    const cleanSlug = normalizeSubdomain(query);
    setLoading(true);
    setMsg(liveSearch && query ? 'Filtering saved websites as you type...' : 'Loading your websites and drafts...');
    try {
      const res = await fetch('/api/site/search', {
        method: 'POST',
        headers: secureHeaders(),
        body: JSON.stringify({ query: cleanSlug })
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || 'Could not find websites.');
        setSites([]);
      } else if (!data.sites?.length) {
        setMsg('No websites or drafts found yet. Try fewer filter words, or open the builder to start a new one.');
        setSites([]);
      } else {
        setSites(data.sites);
        setMsg(data.sites.length === 1 ? 'Your website is ready.' : `${data.sites.length} websites are ready.`);
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

  function rememberDashboardState(slug) {
    try {
      sessionStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify({ query, slug }));
    } catch {}
  }

  function openManagementDialog(site, action, returnFocus) {
    setManagementError('');
    setManagementDialog({ site, action, returnFocus });
  }

  function closeManagementDialog() {
    if (managementBusy) return;
    setManagementError('');
    setManagementDialog(null);
  }

  async function confirmWebsiteAction(confirmation = '') {
    if (!managementDialog || managementBusy) return;
    const { site, action } = managementDialog;
    setManagementBusy(true);
    setManagementError('');
    try {
      const response = await fetch('/api/site/manage', {
        method: 'POST',
        headers: secureHeaders(),
        body: JSON.stringify({ slug: site.slug, action, confirmation })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        setManagementError(result.error || 'The website was not changed.');
        return;
      }
      if (action === 'unpublish') {
        setSites(current => current.map(item => item.slug === site.slug
          ? { ...item, status: 'draft', updated_at: result.updatedAt || new Date().toISOString(), site: { ...(item.site || {}), status: 'draft' } }
          : item));
      } else {
        setSites(current => current.filter(item => item.slug !== site.slug));
      }
      setMsg(result.message);
      setManagementDialog(null);
      window.setTimeout(() => statusRef.current?.focus(), 0);
    } catch {
      setManagementError('The website action could not be completed. Your website remains unchanged.');
    } finally {
      setManagementBusy(false);
    }
  }

  const searchTerm = normalizeSubdomain(query);
  const matchesWords = (value = '') => !searchTerm || normalizeSubdomain(value).includes(searchTerm);
  const visibleSites = sites.filter(site => matchesWords(site.slug) || matchesWords(site.business_name) || matchesWords(site.site?.businessName));
  const shownBrowserDrafts = browserDrafts.filter(item => {
    if (sites.some(site => site.slug === item.slug)) return false;
    return matchesWords(item.slug) || matchesWords(item.draft?.businessName) || matchesWords(item.draft?.draftName);
  });
  const publishedSites = visibleSites.filter(site => customerWebsiteStatus(site) === 'published');
  const unpublishedSites = visibleSites.filter(site => customerWebsiteStatus(site) === 'unpublished');

  function renderSiteCard(row) {
    const status = customerWebsiteStatus(row);
    const isPublished = status === 'published';
    const isUnavailable = isWebsiteUnavailable(row);
    const liveUrl = `https://${row.slug}.${ROOT}`;
    const name = websiteDisplayName(row);
    return (
      <article className="websiteDashboardCard" id={`website-${row.slug}`} key={row.slug}>
        <div className="websiteCardDetails">
          <div className="websiteCardHeading">
            <h3>{name}</h3>
            <span className={`statusPill ${status}`}>{isPublished ? 'Published' : 'Unpublished'}</span>
          </div>
          {isPublished && <p className="websiteAddress"><strong>Website address</strong><a href={liveUrl} target="_blank" rel="noreferrer">{row.slug}.{ROOT}</a></p>}
          <p className="websiteUpdated"><strong>Last updated</strong><span>{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Not available'}</span></p>
          {isUnavailable && <p className="websiteUnavailableNote">This website is safely stored but currently unavailable. Contact support if it should be restored.</p>}
        </div>
        <div className="websiteCardActions">
          {isUnavailable ? (
            <button className="btn dark" type="button" disabled aria-describedby={`website-${row.slug}-unavailable`}>Edit Website</button>
          ) : (
            <a className="btn dark" href={`/customer/edit/${row.slug}`} onClick={() => rememberDashboardState(row.slug)}>Edit Website</a>
          )}
          {isPublished && <a className="btn light" href={liveUrl} target="_blank" rel="noreferrer">View Website</a>}
          <details className="websiteManageMenu">
            <summary>Manage Website</summary>
            <div className="websiteManagePanel">
              {isPublished && <button className="websiteManageAction" type="button" onClick={event => openManagementDialog(row, 'unpublish', event.currentTarget)}>Unpublish Website</button>}
              <button className="websiteManageAction dangerText" type="button" onClick={event => openManagementDialog(row, 'delete', event.currentTarget)}>Delete Website</button>
            </div>
          </details>
          {isUnavailable && <span className="srOnly" id={`website-${row.slug}-unavailable`}>Contact support to restore this website before editing.</span>}
        </div>
      </article>
    );
  }

  const messageIsError = /failed|could not|expired|not changed|do not have access/i.test(msg);

  return (
    <>
      <Nav />
      <main className="wrap customerHub customerHubWarm">
        <section className="dashboard customerDashboardHero">
          <div>
            <span className="kicker">Cookie Mini Website Builder Pro</span>
            <h1>My Websites</h1>
            <p>View, edit, publish, and manage your websites.</p>
          </div>
          {verifiedEmail && <a className="btn" href="/builder">Create a New Website</a>}
        </section>

        {!verifiedEmail && (
          <section className="dashboard customerSignInCard">
            <h2>{authLoading ? 'Checking your account…' : 'Sign in to see your websites'}</h2>
            <p>{authLoading ? 'This will only take a moment.' : 'Only websites saved to your account will appear here.'}</p>
            {!authLoading && <button className="btn" type="button" onClick={() => openAccountModal({ mode: authMode, destination: '/customer' })}>Sign In to My Websites</button>}
          </section>
        )}

        {verifiedEmail && pendingPurchase && (
          <section className="dashboard customerPurchaseReminder" data-testid="continue-purchase">
            <div><strong>Finish your saved purchase</strong><p>Your checkout is still waiting for the website you selected.</p></div>
            <a className="btn" href={pendingPurchase.builderPath}>Continue Purchase</a>
          </section>
        )}

        {verifiedEmail && (
          <section className="dashboard customerWebsiteDashboard" aria-labelledby="website-list-heading">
            <div className="websiteDashboardToolbar">
              <div><h2 id="website-list-heading">Your websites</h2><p>Choose a website to continue.</p></div>
              {sites.length > 1 && <div className="field websiteSearchField">
                <label htmlFor="my-websites-search">Search websites</label>
                <input id="my-websites-search" placeholder="Website name" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />
              </div>}
            </div>
            {msg && <div
              ref={statusRef}
              tabIndex="-1"
              role={messageIsError ? 'alert' : 'status'}
              aria-live={messageIsError ? 'assertive' : 'polite'}
              className={`notice dashboardMessage ${messageIsError ? 'error' : 'success'}`}
            >{msg}</div>}

            {loading ? (
              <div className="emptyState" role="status">Loading your websites…</div>
            ) : sites.length === 0 ? (
              <div className="emptyState customerEmptyState">
                <h2>No websites yet</h2>
                <p>Create your first website now. You can save it, publish it, and return here whenever you need it.</p>
                <a className="btn" href="/builder">Create a New Website</a>
              </div>
            ) : visibleSites.length === 0 ? (
              <div className="emptyState customerEmptyState">
                <h2>No matching websites</h2>
                <p>Try a shorter website name.</p>
                <button className="btn light" type="button" onClick={() => setQuery('')}>Clear Search</button>
              </div>
            ) : (
              <div className="websiteStatusSections">
                <section className="websiteStatusSection" aria-labelledby="published-websites-heading">
                  <div className="websiteSectionHeading"><div><h2 id="published-websites-heading">Published</h2><p>Visitors can open these websites.</p></div><span>{publishedSites.length}</span></div>
                  {publishedSites.length
                    ? <div className="websiteDashboardList">{publishedSites.map(renderSiteCard)}</div>
                    : <div className="emptyState">No published websites yet.</div>}
                </section>
                <section className="websiteStatusSection" aria-labelledby="unpublished-websites-heading">
                  <div className="websiteSectionHeading"><div><h2 id="unpublished-websites-heading">Unpublished</h2><p>These websites are saved but not open to visitors.</p></div><span>{unpublishedSites.length}</span></div>
                  {unpublishedSites.length
                    ? <div className="websiteDashboardList">{unpublishedSites.map(renderSiteCard)}</div>
                    : <div className="emptyState">No unpublished websites.</div>}
                </section>
              </div>
            )}

            <div className="websiteDashboardFooterActions">
              <button className="btn light" type="button" onClick={() => findSites()} disabled={loading}>Refresh Websites</button>
              {browserDraft && <button className="btn light" type="button" onClick={() => continueBrowserDraft(browserDraft)}>Continue Browser Draft</button>}
            </div>
          </section>
        )}

        {verifiedEmail && shownBrowserDrafts.length > 0 && (
          <details className="dashboard browserDraftsCompact">
            <summary>Browser draft backups ({shownBrowserDrafts.length})</summary>
            <p>These drafts are saved only in this browser until you continue and save them to your account.</p>
            <div className="websiteDashboardList">
              {shownBrowserDrafts.map(({ slug, draft }) => (
                <article className="websiteDashboardCard" key={`browser-${slug}`}>
                  <div className="websiteCardDetails"><h3>{draft.businessName || draft.draftName || slug}</h3><p>Saved on this device{draft.updatedAt ? ` · ${new Date(draft.updatedAt).toLocaleDateString()}` : ''}</p></div>
                  <div className="websiteCardActions"><button className="btn dark" type="button" onClick={() => continueBrowserDraft(draft)}>Continue Draft</button></div>
                </article>
              ))}
            </div>
          </details>
        )}
      </main>
      <WebsiteManagementDialog
        dialog={managementDialog}
        busy={managementBusy}
        error={managementError}
        onCancel={closeManagementDialog}
        onConfirm={confirmWebsiteAction}
        fallbackFocusRef={statusRef}
      />
    </>
  );
}
