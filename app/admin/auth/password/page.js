'use client';

import { useEffect, useRef, useState } from 'react';

export default function OwnerPasswordRecoveryPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tokenHash, setTokenHash] = useState('');
  const [type, setType] = useState('');
  const [returnPath, setReturnPath] = useState('/admin');
  const [message, setMessage] = useState('Choose a new password for the Mini Website Builder owner dashboard.');
  const [busy, setBusy] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setTokenHash(hash.get('token_hash') || '');
    setType(hash.get('type') || '');
    setReturnPath(new URLSearchParams(window.location.search).get('return') || '/admin');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }, []);

  function announce(text, focus = false) {
    setMessage(text);
    if (focus) window.setTimeout(() => statusRef.current?.focus(), 0);
  }

  async function submit(event) {
    event.preventDefault();
    if (password !== confirmation) {
      announce('The two password entries do not match.', true);
      return;
    }
    setBusy(true);
    setShowPassword(false);
    announce('Updating your owner password securely…');
    try {
      const response = await fetch('/api/auth/admin/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ tokenHash, type, password, returnPath })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Your owner password could not be updated.');
      announce('Owner password saved. Returning to owner sign-in…');
      const destination = new URL(result.returnPath || '/admin', window.location.origin);
      destination.searchParams.set('password', 'updated');
      window.location.replace(`${destination.pathname}${destination.search}`);
    } catch (error) {
      setPassword('');
      setConfirmation('');
      setShowPassword(false);
      announce(error?.message || 'Your owner password could not be updated. Request a new recovery link.', true);
    } finally {
      setBusy(false);
    }
  }

  return <main className="wrap dashboard passwordRecoveryPage ownerPasswordRecoveryPage">
    <span className="kicker">Secure owner recovery</span>
    <h1>Set or Reset Owner Password</h1>
    <p>This link changes the password for the existing approved owner identity. It cannot create another administrator.</p>
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="owner-recovery-password">New owner password</label>
        <div className="passwordInputRow">
          <input id="owner-recovery-password" type={showPassword ? 'text' : 'password'} required minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="btn light passwordToggle" type="button" aria-controls="owner-recovery-password owner-recovery-confirmation" aria-pressed={showPassword} aria-label={showPassword ? 'Hide new owner password' : 'Show new owner password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide Password' : 'Show Password'}</button>
        </div>
        <small>Use at least 10 characters. Pasting from a password manager is supported.</small>
      </div>
      <div className="field">
        <label htmlFor="owner-recovery-confirmation">Confirm new owner password</label>
        <input id="owner-recovery-confirmation" type={showPassword ? 'text' : 'password'} required minLength={10} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      </div>
      <div className="ownerSignInActions">
        <button className="btn" type="submit" disabled={busy || !tokenHash || type !== 'recovery'}>{busy ? 'Saving…' : 'Save Owner Password'}</button>
        <a className="btn light" href="/admin">Return to Owner Sign-In</a>
        <a className="btn light" href="/">Return to Main Website</a>
      </div>
    </form>
    <div ref={statusRef} className="notice" role="status" aria-live="polite" tabIndex={-1}>{message}</div>
  </main>;
}
