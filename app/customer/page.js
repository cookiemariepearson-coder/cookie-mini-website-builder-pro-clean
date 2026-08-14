'use client';

import { useEffect, useRef, useState } from 'react';
import Nav from '../../lib/Nav';
import { PENDING_CHECKOUT_STORAGE_KEY, createPendingCheckoutIntent, customerReturnPath, pendingCheckoutReturnPath, safeCustomerReturnPath } from '../../lib/commerceConfig.mjs';
import { useAccountModal } from '../../components/AccountModalProvider';
import WebsiteManagementDialog from '../../components/WebsiteManagementDialog';
import BrowserDraftDialog from '../../components/BrowserDraftDialog';
import { customerWebsiteStatus, websiteDisplayName } from '../../lib/customerWebsiteManagement.mjs';
import { templateLibrary } from '../../lib/siteDefaults';
import {
  BROWSER_DRAFT_DISPLAY_NAME_FIELD,
  BROWSER_DRAFT_PAGE_SIZE,
  browserDraftDisplayName,
  currentBrowserDraftMatches,
  deleteBrowserDraftsFromIndex,
  parseBrowserDraftIndex,
  prepareBrowserDraftForContinue,
  renameBrowserDraftInIndex,
  sortBrowserDrafts
} from '../../lib/browserDraftBackups.mjs';

const ROOT = 'cookiesdigitalcreations.com';
const DRAFT_KEY = 'cookieDraftSite';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';
const CURRENT_DRAFT_STORAGE_KEY = 'cookieBuilderCurrentSlug';
const LAST_DRAFT_STEP_KEY = 'cookieBuilderStep';
const GUEST_CLAIM_KEY = 'cookieGuestDraftClaimV1';
const DASHBOARD_STATE_KEY = 'cookieMyWebsitesPageStateV1';
const BROWSER_DRAFT_SORT_KEY = 'cookieBrowserDraftSortV1';

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
  const [browserDrafts, setBrowserDrafts] = useState([]);
  const [browserDraftReadError, setBrowserDraftReadError] = useState('');
  const [browserDraftSort, setBrowserDraftSort] = useState('newest');
  const [browserDraftVisibleCount, setBrowserDraftVisibleCount] = useState(BROWSER_DRAFT_PAGE_SIZE);
  const [browserDraftSelectionMode, setBrowserDraftSelectionMode] = useState(false);
  const [selectedBrowserDrafts, setSelectedBrowserDrafts] = useState([]);
  const [browserDraftDialog, setBrowserDraftDialog] = useState(null);
  const [browserDraftBusy, setBrowserDraftBusy] = useState(false);
  const [browserDraftError, setBrowserDraftError] = useState('');
  const [browserDraftMessage, setBrowserDraftMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [managementDialog, setManagementDialog] = useState(null);
  const [managementBusy, setManagementBusy] = useState(false);
  const [managementError, setManagementError] = useState('');
  const autoLoadedOwnerRef = useRef('');
  const statusRef = useRef(null);
  const browserDraftStatusRef = useRef(null);
  const browserDraftActionLockRef = useRef(false);
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
      const parsed = parseBrowserDraftIndex(localStorage.getItem(DRAFTS_INDEX_KEY) || '');
      setBrowserDrafts(parsed.items);
      setBrowserDraftReadError(parsed.error);
      const savedSort = sessionStorage.getItem(BROWSER_DRAFT_SORT_KEY);
      if (['newest', 'oldest', 'name'].includes(savedSort)) setBrowserDraftSort(savedSort);
    } catch {
      setBrowserDraftReadError('Browser draft backups are unavailable in this browser. No backups were changed.');
    }
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

  function continueBrowserDraft(item) {
    const draft = prepareBrowserDraftForContinue(item);
    if (!draft) {
      setBrowserDraftMessage('This browser draft is damaged or outdated and cannot be opened. No backups were changed.');
      window.setTimeout(() => browserDraftStatusRef.current?.focus(), 0);
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      localStorage.setItem(CURRENT_DRAFT_STORAGE_KEY, item.storageKey);
      sessionStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify({ query, slug: '', browserDraftSort }));
    } catch {
      setBrowserDraftMessage('This browser draft could not be opened because browser storage is unavailable. No backups were changed.');
      window.setTimeout(() => browserDraftStatusRef.current?.focus(), 0);
      return;
    }
    window.location.href = '/builder?restore=1';
  }

  function refreshBrowserDrafts(serialized) {
    const parsed = parseBrowserDraftIndex(serialized);
    setBrowserDrafts(parsed.items);
    setBrowserDraftReadError(parsed.error);
    setBrowserDraftVisibleCount(current => Math.max(BROWSER_DRAFT_PAGE_SIZE, Math.min(current, Math.max(parsed.items.length, BROWSER_DRAFT_PAGE_SIZE))));
    return parsed;
  }

  function browserDraftReturnFocus(element) {
    return element?.closest?.('details')?.querySelector?.('summary') || element;
  }

  function openBrowserDraftDialog(item, action, returnFocus) {
    setBrowserDraftError('');
    setBrowserDraftDialog({ item, action, returnFocus: browserDraftReturnFocus(returnFocus) });
  }

  function closeBrowserDraftDialog() {
    if (browserDraftBusy) return;
    setBrowserDraftError('');
    setBrowserDraftDialog(null);
  }

  function readCurrentBrowserDraft() {
    try {
      return {
        draft: JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'),
        storageKey: localStorage.getItem(CURRENT_DRAFT_STORAGE_KEY) || ''
      };
    } catch {
      return { draft: null, storageKey: '' };
    }
  }

  function syncRenamedCurrentDraft(storageKey, name) {
    const current = readCurrentBrowserDraft();
    if (!currentBrowserDraftMatches(current.draft, current.storageKey, [storageKey]) || !current.draft) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        ...current.draft,
        [BROWSER_DRAFT_DISPLAY_NAME_FIELD]: name
      }));
    } catch {}
  }

  function removeDeletedCurrentDraft(storageKeys) {
    const current = readCurrentBrowserDraft();
    if (!currentBrowserDraftMatches(current.draft, current.storageKey, storageKeys)) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(CURRENT_DRAFT_STORAGE_KEY);
      localStorage.removeItem(LAST_DRAFT_STEP_KEY);
    } catch {}
  }

  function finishBrowserDraftAction(message) {
    setBrowserDraftMessage(message);
    setBrowserDraftDialog(null);
    setBrowserDraftError('');
    window.setTimeout(() => browserDraftStatusRef.current?.focus(), 0);
  }

  function confirmBrowserDraftAction(name = '') {
    if (!browserDraftDialog || browserDraftActionLockRef.current) return;
    browserDraftActionLockRef.current = true;
    setBrowserDraftBusy(true);
    setBrowserDraftError('');
    try {
      const raw = localStorage.getItem(DRAFTS_INDEX_KEY) || '';
      if (browserDraftDialog.action === 'rename') {
        const storageKey = browserDraftDialog.item.storageKey;
        const result = renameBrowserDraftInIndex(raw, storageKey, name);
        localStorage.setItem(DRAFTS_INDEX_KEY, result.serialized);
        refreshBrowserDrafts(result.serialized);
        syncRenamedCurrentDraft(storageKey, result.name);
        finishBrowserDraftAction(`Browser draft renamed to ${result.name}. Its saved website content is unchanged.`);
        return;
      }

      const storageKeys = browserDraftDialog.action === 'delete'
        ? [browserDraftDialog.item.storageKey]
        : browserDraftDialog.action === 'delete-selected'
          ? [...selectedBrowserDrafts]
          : browserDrafts.map(item => item.storageKey);
      if (!storageKeys.length) throw new Error('Choose at least one browser draft to delete.');
      const result = deleteBrowserDraftsFromIndex(raw, storageKeys);
      if (!result.removedKeys.length) throw new Error('Those browser draft backups were already removed. No other backups were changed.');
      localStorage.setItem(DRAFTS_INDEX_KEY, result.serialized);
      refreshBrowserDrafts(result.serialized);
      removeDeletedCurrentDraft(result.removedKeys);
      setSelectedBrowserDrafts([]);
      setBrowserDraftSelectionMode(false);
      const message = result.removedKeys.length === 1
        ? 'Browser draft backup deleted. Your published and server-saved websites are unchanged.'
        : `${result.removedKeys.length} browser draft backups deleted. Your published and server-saved websites are unchanged.`;
      finishBrowserDraftAction(message);
    } catch (error) {
      setBrowserDraftError(error.message || 'Browser draft backups could not be changed. No backups were removed.');
    } finally {
      setBrowserDraftBusy(false);
      window.setTimeout(() => { browserDraftActionLockRef.current = false; }, 0);
    }
  }

  function toggleBrowserDraftSelection(storageKey) {
    setSelectedBrowserDrafts(current => current.includes(storageKey)
      ? current.filter(key => key !== storageKey)
      : [...current, storageKey]);
  }

  function cancelBrowserDraftSelection() {
    setSelectedBrowserDrafts([]);
    setBrowserDraftSelectionMode(false);
  }

  function changeBrowserDraftSort(value) {
    const next = ['newest', 'oldest', 'name'].includes(value) ? value : 'newest';
    setBrowserDraftSort(next);
    try { sessionStorage.setItem(BROWSER_DRAFT_SORT_KEY, next); } catch {}
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
  const sortedBrowserDrafts = sortBrowserDrafts(browserDrafts, browserDraftSort);
  const visibleBrowserDrafts = sortedBrowserDrafts.slice(0, browserDraftVisibleCount);
  const publishedSites = visibleSites.filter(site => customerWebsiteStatus(site) === 'published');
  const unpublishedSites = visibleSites.filter(site => customerWebsiteStatus(site) === 'unpublished');

  function browserDraftSavedLabel(item) {
    if (item.savedTime === null) return item.usable ? 'Saved time unavailable' : 'Unreadable backup';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(item.savedTime);
  }

  function browserDraftTemplateLabel(item) {
    if (!item.usable) return '';
    const type = templateLibrary.find(entry => entry.key === item.draft?.typeKey);
    if (!type) return '';
    const style = type.styles?.find(entry => entry.key === item.draft?.styleKey);
    return style ? `${type.type} · ${style.name}` : type.type;
  }

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

  function renderBrowserDraftCard(item) {
    const name = browserDraftDisplayName(item);
    const template = browserDraftTemplateLabel(item);
    const selected = selectedBrowserDrafts.includes(item.storageKey);
    return (
      <article className={`websiteDashboardCard browserDraftCard ${selected ? 'browserDraftCardSelected' : ''}`} key={`browser-${item.storageKey}`}>
        {browserDraftSelectionMode && (
          <label className="browserDraftCheckbox">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleBrowserDraftSelection(item.storageKey)}
            />
            <span>Select {name}</span>
          </label>
        )}
        <div className="websiteCardDetails browserDraftCardDetails">
          <div className="websiteCardHeading">
            <h3>{name}</h3>
            <span className="browserDraftBadge">Browser backup</span>
          </div>
          <p className="browserDraftSaved"><strong>Last saved</strong><span>{browserDraftSavedLabel(item)}</span></p>
          {template && <p className="browserDraftTemplate"><strong>Template</strong><span>{template}</span></p>}
          {!item.usable && <p className="websiteUnavailableNote" role="status">This backup is damaged or outdated. It cannot be continued or renamed, but you can safely remove this one browser backup.</p>}
        </div>
        <div className="websiteCardActions browserDraftCardActions">
          <button className="btn dark" type="button" onClick={() => continueBrowserDraft(item)} disabled={!item.usable}>Continue Draft</button>
          <details className="websiteManageMenu browserDraftManageMenu">
            <summary aria-label={`Manage ${name} browser draft`}>Manage Draft</summary>
            <div className="websiteManagePanel">
              <button
                className="websiteManageAction"
                type="button"
                disabled={!item.usable}
                onClick={event => openBrowserDraftDialog(item, 'rename', event.currentTarget)}
              >Rename Draft</button>
              <button
                className="websiteManageAction dangerText"
                type="button"
                onClick={event => openBrowserDraftDialog(item, 'delete', event.currentTarget)}
              >Delete Draft</button>
            </div>
          </details>
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
            </div>
          </section>
        )}

        {verifiedEmail && (
          <section className="dashboard browserDraftSection" aria-labelledby="browser-drafts-heading">
            <div className="browserDraftHeader">
              <div>
                <div className="websiteSectionHeading browserDraftHeadingLine">
                  <h2 id="browser-drafts-heading">Browser Draft Backups</h2>
                  <span role="status" aria-live="polite" aria-label={`${browserDrafts.length} browser draft backups`}>{browserDrafts.length}</span>
                </div>
                <p>These backups are saved in this browser. They help you continue website drafts you started on this device.</p>
                <p className="browserDraftDeviceNote">Browser draft backups may not appear on your other devices. They can also be removed if this browser’s site data is cleared.</p>
              </div>
              {browserDrafts.length > 0 && (
                <div className="browserDraftToolbar">
                  <label htmlFor="browser-draft-sort">Sort drafts</label>
                  <select id="browser-draft-sort" value={browserDraftSort} onChange={event => changeBrowserDraftSort(event.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name</option>
                  </select>
                  {!browserDraftSelectionMode && <button className="btn light" type="button" onClick={() => setBrowserDraftSelectionMode(true)}>Select Drafts</button>}
                </div>
              )}
            </div>

            {(browserDraftMessage || browserDraftReadError) && <div
              ref={browserDraftStatusRef}
              tabIndex="-1"
              role={browserDraftReadError ? 'alert' : 'status'}
              aria-live={browserDraftReadError ? 'assertive' : 'polite'}
              className={`notice dashboardMessage ${browserDraftReadError ? 'error' : 'success'}`}
            >{browserDraftReadError || browserDraftMessage}</div>}

            {browserDraftSelectionMode && (
              <div className="browserDraftBulkBar" role="group" aria-label="Selected browser draft actions">
                <strong>{selectedBrowserDrafts.length} selected</strong>
                <div>
                  <button className="btn light" type="button" onClick={cancelBrowserDraftSelection}>Cancel Selection</button>
                  <button
                    className="btn danger"
                    type="button"
                    disabled={!selectedBrowserDrafts.length}
                    onClick={event => setBrowserDraftDialog({
                      action: 'delete-selected',
                      count: selectedBrowserDrafts.length,
                      returnFocus: event.currentTarget
                    })}
                  >Delete Selected</button>
                </div>
              </div>
            )}

            {browserDrafts.length === 0 ? (
              !browserDraftReadError && <div className="emptyState customerEmptyState browserDraftEmptyState">
                <h3>No browser draft backups</h3>
                <p>No browser draft backups remain. Your published and server-saved websites are unchanged.</p>
              </div>
            ) : (
              <>
                <div className="websiteDashboardList browserDraftList">{visibleBrowserDrafts.map(renderBrowserDraftCard)}</div>
                {visibleBrowserDrafts.length < sortedBrowserDrafts.length && (
                  <button className="btn light browserDraftShowMore" type="button" onClick={() => setBrowserDraftVisibleCount(count => count + BROWSER_DRAFT_PAGE_SIZE)}>
                    Show More ({sortedBrowserDrafts.length - visibleBrowserDrafts.length} remaining)
                  </button>
                )}
                <details className="browserDraftMoreOptions">
                  <summary>More draft options</summary>
                  <div>
                    <p>Use this only if you want to remove every browser backup shown above.</p>
                    <button
                      className="websiteManageAction dangerText"
                      type="button"
                      onClick={event => setBrowserDraftDialog({
                        action: 'delete-all',
                        count: browserDrafts.length,
                        returnFocus: event.currentTarget.closest('details')?.querySelector('summary') || event.currentTarget
                      })}
                    >Delete All Browser Drafts</button>
                  </div>
                </details>
              </>
            )}
          </section>
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
      <BrowserDraftDialog
        dialog={browserDraftDialog}
        busy={browserDraftBusy}
        error={browserDraftError}
        onCancel={closeBrowserDraftDialog}
        onConfirm={confirmBrowserDraftAction}
        fallbackFocusRef={browserDraftStatusRef}
      />
    </>
  );
}
