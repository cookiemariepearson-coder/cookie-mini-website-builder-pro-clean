'use client';

import { useEffect, useState } from 'react';

export default function AdminAuthCallback() {
  const [message, setMessage] = useState('Verifying your secure owner link...');
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const error = params.get('error_description') || params.get('error');
    window.history.replaceState({}, document.title, window.location.pathname);
    if (error || !accessToken) {
      setMessage(error || 'This owner link is invalid or expired. Return to Admin and request a new link.');
      return;
    }
    fetch('/api/auth/admin/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken })
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Owner sign-in failed.');
      window.location.replace('/admin?verified=1');
    }).catch((err) => setMessage(err.message || 'Owner sign-in failed.'));
  }, []);
  return <main className="wrap dashboard"><span className="kicker">Secure Owner Access</span><h1>Signing you in</h1><p>{message}</p><a className="btn light" href="/admin">Return to Admin</a></main>;
}
