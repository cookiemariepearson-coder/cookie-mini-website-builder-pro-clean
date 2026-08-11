'use client';

import { useEffect, useState } from 'react';
import Nav from '../../../../lib/Nav';

export default function CustomerPasswordRecoveryPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tokenHash, setTokenHash] = useState('');
  const [type, setType] = useState('');
  const [returnPath, setReturnPath] = useState('/customer');
  const [message, setMessage] = useState('Choose a new password for your existing Mini Website Builder account.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setTokenHash(hash.get('token_hash') || '');
    setType(hash.get('type') || '');
    setReturnPath(new URLSearchParams(window.location.search).get('return') || '/customer');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('Updating your password securely…');
    try {
      const response = await fetch('/api/auth/site-owner/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenHash, type, password, returnPath })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Your password could not be updated.');
      setMessage('Password saved. Opening your Mini Website Builder account…');
      window.location.replace(result.returnPath || '/customer');
    } catch (error) {
      setMessage(error.message || 'Your password could not be updated. Request a new recovery link.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Nav />
    <main className="wrap dashboard passwordRecoveryPage">
      <span className="kicker">Secure account recovery</span>
      <h1>Set or reset your password</h1>
      <p>This keeps your existing user ID, drafts, published websites, plans, purchases, and video history together.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="recovery-password">New password</label>
          <div className="passwordInputRow">
            <input id="recovery-password" type={showPassword ? 'text' : 'password'} required minLength={10} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
            <button className="btn light passwordToggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <small>Use at least 10 characters. Pasting from a password manager is supported.</small>
        </div>
        <button className="btn" type="submit" disabled={busy || !tokenHash || type !== 'recovery'}>{busy ? 'Saving…' : 'Save Password'}</button>
      </form>
      <div className="notice" role="status" aria-live="polite">{message}</div>
      <p><a className="btn light" href="/customer?mode=signin">Return to Sign In</a></p>
    </main>
  </>;
}
