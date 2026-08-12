'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Nav from '../../../lib/Nav';

const turnaround = {
  'Free Launch Page': '3–5 business days',
  'Starter Pro': '5–7 business days',
  Business: '7–10 business days',
  Premium: '10–14 business days',
  'Extra Page Add-On': '3–5 business days'
};

export default function DoneForYouRequestPage() {
  const [plan, setPlan] = useState('Website Setup Consultation');
  const [form, setForm] = useState({ name: '', business: '', businessType: '', email: '', phone: '', customerAction: '', details: '', contact: 'Email', companyWebsite: '' });
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionIdRef = useRef('');

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get('plan');
    if (selected) setPlan(selected);
  }, []);

  useEffect(() => {
    if (!status || statusKind !== 'success') return;
    const timer = window.setTimeout(() => setStatus(''), 8500);
    return () => window.clearTimeout(timer);
  }, [status, statusKind]);

  const estimate = turnaround[plan] || 'Confirmed after your content is reviewed';
  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!submissionIdRef.current) submissionIdRef.current = window.crypto.randomUUID();
    const submissionId = submissionIdRef.current;
    setSubmitting(true);
    setStatusKind('progress');
    setStatus('Sending your request and confirmation email...');
    try {
      const response = await fetch('/api/done-for-you/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, ...form, submissionId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Request failed.');
      submissionIdRef.current = '';
      setForm({ name: '', business: '', businessType: '', email: '', phone: '', customerAction: '', details: '', contact: 'Email', companyWebsite: '' });
      setStatusKind('success');
      if (data.checkoutRequired && data.checkoutConfigured && data.checkoutUrl) {
        setStatus('Request received. Opening secure checkout…');
        setTimeout(() => window.location.assign(data.checkoutUrl), 900);
      } else if (data.checkoutRequired) {
        setStatus('Request received. We’ll email you the next step.');
      } else {
        setStatus('Request received. We’ll email you the next step.');
      }
    } catch (error) {
      setStatusKind('error');
      setStatus(error.message || 'The request could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <Nav />
    <main className="wrap dfyRequestPage">
      <section className="dfyRequestIntro">
        <span className="kicker">Done-for-You request</span>
        <h1>Tell me what you need.</h1>
        <p>Complete this short form. Cookie Digital Creations will receive your request, and you will receive an automatic confirmation with turnaround, preparation details, and the next payment step.</p>
        <div className="requestEstimate"><strong>Selected:</strong> {plan}<span><strong>Estimated turnaround:</strong> {estimate}</span></div>
      </section>

      <form className="dfyRequestForm" onSubmit={submit}>
        <div className="field">
          <label htmlFor="dfy-service">Service</label>
          <select id="dfy-service" value={plan} onChange={event => setPlan(event.target.value)}>
            {['Website Setup Consultation','Free Launch Page','Starter Pro','Business','Premium','Extra Page Add-On'].map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="dfy-name">Your name</label><input id="dfy-name" required autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} /></div>
          <div className="field"><label htmlFor="dfy-business">Business name</label><input id="dfy-business" required autoComplete="organization" value={form.business} onChange={e => update('business', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="dfy-business-type">Business type</label><input id="dfy-business-type" required placeholder="Example: catering, beauty, consulting" value={form.businessType} onChange={e => update('businessType', e.target.value)} /></div>
          <div className="field"><label htmlFor="dfy-email">Email</label><input id="dfy-email" required type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="dfy-phone">Phone, optional</label><input id="dfy-phone" type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
          <div className="field"><label htmlFor="dfy-contact">Preferred contact</label><select id="dfy-contact" value={form.contact} onChange={e => update('contact', e.target.value)}><option>Email</option><option>Phone call</option><option>Text message</option></select></div>
        </div>
        <div className="field"><label htmlFor="dfy-action">What should customers do on your website?</label><input id="dfy-action" required placeholder="Book, order, buy, call, request a quote..." value={form.customerAction} onChange={e => update('customerAction', e.target.value)} /></div>
        <div className="field"><label htmlFor="dfy-details">Tell me about the website you want</label><textarea id="dfy-details" required placeholder="Describe your services, products, pages, colors, photos, and anything important." value={form.details} onChange={e => update('details', e.target.value)} /></div>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }}><label htmlFor="dfy-company-website">Company website</label><input id="dfy-company-website" tabIndex="-1" autoComplete="off" value={form.companyWebsite} onChange={e => update('companyWebsite', e.target.value)} /></div>
        <div className="dfyRequestActions">
          <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Sending Request...' : 'Submit Request & Continue'}</button>
          <Link className="btn light" href="/done-for-you">Back to Services</Link>
          <button className="btn dark" type="button" data-cookie-ai-open="Help me choose a Done-for-You website service.">Ask Cookie AI First</button>
        </div>
        {status && <div className={`notice compactRequestToast ${statusKind === 'error' ? 'error' : statusKind === 'success' ? 'success' : ''}`} role={statusKind === 'error' ? 'alert' : 'status'} aria-live={statusKind === 'error' ? 'assertive' : 'polite'}>
          <span>{status}</span>
          {statusKind === 'success' && <button type="button" className="saveStatusDismiss" onClick={() => setStatus('')} aria-label="Dismiss request confirmation">×</button>}
        </div>}
        <p className="requestNote">Paid services continue to secure checkout after the request is received. Your build turnaround begins after payment and all required content are received.</p>
      </form>
    </main>
  </>;
}
