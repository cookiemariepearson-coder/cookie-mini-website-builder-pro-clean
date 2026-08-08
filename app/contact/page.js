'use client';

import { useState } from 'react';
import Nav from '../../lib/Nav';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', website: '', message: '', companyWebsite: '' });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setStatus('Sending your support message...');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Your message could not be sent.');
      setStatus(data.message);
      setForm(current => ({ ...current, message: '', companyWebsite: '' }));
    } catch (error) {
      setStatus(error.message || 'Your message could not be sent. Please email hello@cookiesdigitalcreations.com.');
    } finally {
      setSending(false);
    }
  }

  const failed = /could not|unavailable|try again/i.test(status);
  return <>
    <Nav />
    <main className="wrap dashboard">
      <h1>Contact / Support</h1>
      <p>Tell us what happened and include your website name if you have one.</p>
      <form onSubmit={submit}>
        <div className="row">
          <div className="field"><label htmlFor="support-name">Your name</label><input id="support-name" required autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} /></div>
          <div className="field"><label htmlFor="support-email">Email</label><input id="support-email" required type="email" autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="support-website">Website name or subdomain, optional</label><input id="support-website" value={form.website} onChange={event => update('website', event.target.value)} placeholder="Example: my-business" /></div>
        <div className="field"><label htmlFor="support-message">How can we help?</label><textarea id="support-message" required value={form.message} onChange={event => update('message', event.target.value)} /></div>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }}><label htmlFor="company-website">Company website</label><input id="company-website" tabIndex="-1" autoComplete="off" value={form.companyWebsite} onChange={event => update('companyWebsite', event.target.value)} /></div>
        <button className="btn" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send Support Message'}</button>
      </form>
      {status && <div className={`notice ${failed ? 'error' : ''}`} role={failed ? 'alert' : 'status'} aria-live="polite">{status}</div>}
      <p>If the form is unavailable, <a href="mailto:hello@cookiesdigitalcreations.com?subject=Cookie%20Mini%20Website%20Builder%20Support">email hello@cookiesdigitalcreations.com</a>.</p>
    </main>
  </>;
}
