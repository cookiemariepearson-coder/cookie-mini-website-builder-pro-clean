'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function OwnerSignInPanel({ returnPath = '/admin', description = 'Enter the owner email and password to open this protected dashboard.' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('Owner password sign-in is required.');
  const statusRef = useRef(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('password') !== 'updated') return;
    setMessage('Your owner password was saved. Sign in with the new password.');
    url.searchParams.delete('password');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
  }, []);

  function announce(text, focus = false) {
    setMessage(text);
    if (focus) window.setTimeout(() => statusRef.current?.focus(), 0);
  }

  async function request(action) {
    setBusyAction(action);
    setShowPassword(false);
    announce(action === 'signin' ? 'Signing in securely…' : 'Requesting a secure password recovery link…');
    try {
      const body = action === 'signin'
        ? { action, email, password, returnPath, companyWebsite }
        : { action, email, returnPath, companyWebsite };
      const response = await fetch('/api/auth/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Owner access is temporarily unavailable.');
      if (action === 'signin') {
        announce('Owner verified. Opening the dashboard…');
        window.location.replace(result.returnPath || '/admin');
        return;
      }
      announce(result.message || 'If this email belongs to the owner account, a password recovery link will arrive shortly.', true);
    } catch (error) {
      setPassword('');
      setShowPassword(false);
      announce(error?.message || 'Owner access is temporarily unavailable. Please try again.', true);
    } finally {
      setBusyAction('');
    }
  }

  return <section className="adminPanel ownerSignInPanel" aria-labelledby="owner-sign-in-title">
    <span className="kicker">Owner only</span>
    <h2 id="owner-sign-in-title">Owner Sign-In</h2>
    <p>{description}</p>
    <form onSubmit={(event) => { event.preventDefault(); request('signin'); }}>
      <div className="field">
        <label htmlFor="owner-sign-in-email">Owner email</label>
        <input
          id="owner-sign-in-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="owner-sign-in-password">Password</label>
        <div className="passwordInputRow">
          <input
            id="owner-sign-in-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="btn light passwordToggle"
            type="button"
            aria-controls="owner-sign-in-password"
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide owner password' : 'Show owner password'}
            onClick={() => setShowPassword((visible) => !visible)}
          >{showPassword ? 'Hide Password' : 'Show Password'}</button>
        </div>
      </div>
      <div className="ownerAuthHoneypot" aria-hidden="true">
        <label htmlFor="owner-company-website">Company website</label>
        <input id="owner-company-website" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} />
      </div>
      <div className="ownerSignInActions">
        <button className="btn" type="submit" disabled={Boolean(busyAction)}>{busyAction === 'signin' ? 'Signing In…' : 'Sign In'}</button>
        <button className="btn light" type="button" disabled={Boolean(busyAction) || !email} onClick={() => request('reset')}>{busyAction === 'reset' ? 'Requesting…' : 'Set or Reset Password'}</button>
        <Link className="btn light" href="/">Return to Main Website</Link>
      </div>
    </form>
    <div ref={statusRef} className="notice ownerSignInStatus" role="status" aria-live="polite" tabIndex={-1}>{message}</div>
  </section>;
}
