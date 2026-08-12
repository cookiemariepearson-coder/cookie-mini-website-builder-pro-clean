'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AccountModalContext = createContext(null);
const LEGACY_AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';
const GUEST_CLAIM_KEY = 'cookieGuestDraftClaimV1';
const DRAFT_KEY = 'cookieDraftSite';

function safeDestination(value = '') {
  const path = String(value || '').trim();
  if (path === '/builder' || path === '/customer' || path === '/customer/account' || path === '/video-studio') return path;
  if (/^\/customer\/edit\/[a-z0-9-]+$/.test(path)) return path;
  if (/^\/checkout\/continue\?intent=[0-9a-f-]+(?:&draft=[a-z0-9-]+)?$/i.test(path)) return path;
  if (/^\/builder\?(?:checkout|checkoutIntent)=/.test(path)) return path;
  return '/customer';
}

async function prepareGuestDraftClaim() {
  let draft = null;
  let existing = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    existing = JSON.parse(localStorage.getItem(GUEST_CLAIM_KEY) || 'null');
  } catch {}
  if (!draft) return null;
  let response = await fetch('/api/site/guest-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site: draft, claimId: existing?.claimId || '', claimToken: existing?.claimToken || '' })
  });
  if (response.status === 410 && existing) {
    localStorage.removeItem(GUEST_CLAIM_KEY);
    return prepareGuestDraftClaim();
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || 'Your browser draft could not be prepared for permanent saving.');
  localStorage.setItem(GUEST_CLAIM_KEY, JSON.stringify({ claimId: result.claimId, claimToken: result.claimToken, expiresAt: result.expiresAt }));
  return result;
}

async function claimGuestDraft() {
  let claim = null;
  try { claim = JSON.parse(localStorage.getItem(GUEST_CLAIM_KEY) || 'null'); } catch {}
  if (!claim?.claimId || !claim?.claimToken) return null;
  const response = await fetch('/api/site/guest-draft/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimId: claim.claimId, claimToken: claim.claimToken })
  });
  const result = await response.json().catch(() => ({}));
  if (result.ok) {
    localStorage.removeItem(GUEST_CLAIM_KEY);
    localStorage.setItem('cookieGuestDraftClaimedSlug', result.slug || '');
  }
  return result;
}

export function useAccountModal() {
  const value = useContext(AccountModalContext);
  if (!value) throw new Error('useAccountModal must be used inside AccountModalProvider.');
  return value;
}

export function AccountAction({ children, destination = '/customer', guestAllowed = false, mode = 'signin', className = 'btn', ariaLabel = '' }) {
  const { accountState, openAccountModal } = useAccountModal();
  function activate() {
    const next = safeDestination(destination);
    if (accountState === 'signed-in') window.location.assign(next);
    else openAccountModal({ mode, destination: next, guestAllowed });
  }
  return <button type="button" className={className} onClick={activate} aria-label={ariaLabel || undefined}>{children}</button>;
}

export default function AccountModalProvider({ children }) {
  const [accountState, setAccountState] = useState('checking');
  const [accountEmail, setAccountEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin');
  const [destination, setDestination] = useState('/customer');
  const [guestAllowed, setGuestAllowed] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const triggerRef = useRef(null);

  const refreshSession = useCallback(async () => {
    let legacyToken = '';
    try { legacyToken = localStorage.getItem(LEGACY_AUTH_TOKEN_KEY) || ''; } catch {}
    try {
      const response = await fetch('/api/auth/site-owner/session', {
        cache: 'no-store',
        headers: legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {}
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok) {
        setAccountState('signed-in');
        setAccountEmail(result.email || '');
        try { localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY); } catch {}
        return result;
      }
    } catch {}
    setAccountState('signed-out');
    setAccountEmail('');
    return null;
  }, []);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  const openAccountModal = useCallback((options = {}) => {
    if (accountState === 'signed-in') {
      window.location.assign(safeDestination(options.destination || '/customer'));
      return;
    }
    triggerRef.current = document.activeElement;
    setMode(options.mode === 'create' ? 'create' : options.mode === 'reset' ? 'reset' : 'signin');
    setDestination(safeDestination(options.destination || '/customer'));
    setGuestAllowed(Boolean(options.guestAllowed));
    setPassword('');
    setShowPassword(false);
    setMessage('');
    setError('');
    setOpen(true);
  }, [accountState]);

  const closeAccountModal = useCallback(() => {
    setOpen(false);
    setBusy(false);
    window.setTimeout(() => triggerRef.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    function handleOpen(event) { openAccountModal(event.detail || {}); }
    window.addEventListener('cookie:open-account', handleOpen);
    return () => window.removeEventListener('cookie:open-account', handleOpen);
  }, [openAccountModal]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => headingRef.current?.focus(), 0);
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAccountModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])') || []).filter(item => !item.closest('[aria-hidden="true"]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage(mode === 'signin' ? 'Signing in securely…' : mode === 'create' ? 'Preparing your confirmation email…' : 'Preparing your password email…');
    try {
      if (mode === 'create') await prepareGuestDraftClaim();
      const response = await fetch('/api/auth/site-owner/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode === 'create' ? 'signup' : mode, displayName, email, password, returnPath: destination, companyWebsite })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Account access is temporarily unavailable.');
      if (mode === 'signin') {
        await claimGuestDraft();
        setAccountState('signed-in');
        setAccountEmail(result.email || email.trim().toLowerCase());
        setMessage('Signed in. Opening your saved destination…');
        window.location.assign(result.returnPath || destination);
        return;
      }
      setMessage(result.message || (mode === 'create' ? 'Check your email to confirm your account.' : 'If the account exists, a password link will arrive shortly.'));
    } catch (submitError) {
      setMessage('');
      setError(submitError.message || 'Account access is temporarily unavailable.');
    } finally {
      setBusy(false);
    }
  }

  function continueGuest() {
    try { sessionStorage.setItem('cookieBuilderGuestChoice', '1'); } catch {}
    setOpen(false);
    window.location.assign(safeDestination(destination));
  }

  async function signOut() {
    setAccountState('checking');
    try { await fetch('/api/auth/site-owner/signout', { method: 'POST' }); } catch {}
    try { localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY); } catch {}
    setAccountState('signed-out');
    setAccountEmail('');
    window.location.assign('/');
  }

  const contextValue = useMemo(() => ({ accountState, accountEmail, openAccountModal, closeAccountModal, refreshSession, signOut }), [accountState, accountEmail, openAccountModal, closeAccountModal, refreshSession]);
  const heading = mode === 'create' ? 'Create your free account' : mode === 'reset' ? 'Set or reset your password' : 'Welcome back';
  const support = mode === 'create'
    ? 'Save your websites, open them on another device, purchase a plan, and publish when you’re ready.'
    : mode === 'reset'
      ? 'We’ll email a one-time recovery link. Your existing websites and purchases stay with the same account.'
      : 'Sign in to open your saved websites and continue building. Previously signed in with an email link? Set your password here once.';

  return <AccountModalContext.Provider value={contextValue}>
    <div className="accountModalBackground" inert={open ? '' : undefined} aria-hidden={open ? 'true' : undefined}>{children}</div>
    {open && <div className="accountModalBackdrop" role="presentation">
      <section ref={dialogRef} className="accountModal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title" aria-describedby="account-modal-support" onKeyDown={handleDialogKeyDown}>
        <button className="accountModalClose" type="button" onClick={closeAccountModal} aria-label="Close account window">×</button>
        <div className="accountModalBrand">
          <img src="/cookie-mini-website-builder-logo.png" alt="" />
          <div><span>Cookie Mini Website Builder Pro</span><small>Secure customer account</small></div>
        </div>
        <h2 id="account-modal-title" ref={headingRef} tabIndex="-1">{heading}</h2>
        <p id="account-modal-support">{support}</p>
        <form onSubmit={submit}>
          {mode === 'create' && <div className="field"><label htmlFor="account-display-name">Display name</label><input id="account-display-name" required autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} /></div>}
          <div className="field"><label htmlFor="account-email">Email</label><input id="account-email" required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></div>
          {mode !== 'reset' && <div className="field">
            <label htmlFor="account-password">Password</label>
            <div className="passwordInputRow"><input id="account-password" required type={showPassword ? 'text' : 'password'} minLength={mode === 'create' ? 10 : undefined} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} /><button className="btn light passwordToggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div>
            {mode === 'create' && <small>Use at least 10 characters. Password-manager paste is supported.</small>}
          </div>}
          <div aria-hidden="true" className="accountHoneypot"><label htmlFor="account-company-website">Company website</label><input id="account-company-website" tabIndex="-1" autoComplete="off" value={companyWebsite} onChange={event => setCompanyWebsite(event.target.value)} /></div>
          <button className="btn accountPrimary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'create' ? 'Create Free Account' : mode === 'reset' ? 'Email Password Link' : 'Sign In'}</button>
        </form>
        {error && <div className="notice error accountModalMessage" role="alert">{error}</div>}
        {message && <div className="notice success accountModalMessage" role="status" aria-live="polite">{message}</div>}
        <div className="accountModalChoices">
          {mode === 'signin' && <><button type="button" onClick={() => { setMode('reset'); setMessage(''); setError(''); }}>Set or Reset Password</button><button type="button" onClick={() => { setMode('create'); setMessage(''); setError(''); }}>Need an account? Create Free Account</button></>}
          {mode === 'create' && <button type="button" onClick={() => { setMode('signin'); setMessage(''); setError(''); }}>Already have an account? Sign In</button>}
          {mode === 'reset' && <button type="button" onClick={() => { setMode('signin'); setMessage(''); setError(''); }}>Return to Sign In</button>}
          {guestAllowed && <button type="button" onClick={continueGuest}>Continue as Guest</button>}
        </div>
        <p className="accountModalLegal">By creating an account, you agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>. Need help? <a href="mailto:hello@cookiesdigitalcreations.com">Contact Cookie</a>.</p>
      </section>
    </div>}
  </AccountModalContext.Provider>;
}
