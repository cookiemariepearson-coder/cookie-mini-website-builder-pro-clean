'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [form, setForm] = useState({ name: '', business: '', businessType: '', email: '', phone: '', customerAction: '', details: '', contact: 'Email' });

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get('plan');
    if (selected) setPlan(selected);
  }, []);

  const estimate = turnaround[plan] || 'Confirmed after your content is reviewed';
  const message = useMemo(() => `Hello Cookie Digital Creations,

I would like to request the ${plan} Done-for-You service.

Name: ${form.name}
Business name: ${form.business}
Business type: ${form.businessType}
Email: ${form.email}
Phone: ${form.phone || 'Not provided'}
Preferred contact: ${form.contact}
What customers need to do: ${form.customerAction}

Website details:
${form.details}

Please contact me with the next steps.`, [form, plan]);

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    window.location.href = `mailto:hello@cookiesdigitalcreations.com?subject=${encodeURIComponent(`Done-for-You Website Request — ${plan}`)}&body=${encodeURIComponent(message)}`;
  }

  return <>
    <Nav />
    <main className="wrap dfyRequestPage">
      <section className="dfyRequestIntro">
        <span className="kicker">Done-for-You request</span>
        <h1>Tell me what you need.</h1>
        <p>Complete this short form. Your selected service and answers will be placed into an email addressed to Cookie Digital Creations.</p>
        <div className="requestEstimate"><strong>Selected:</strong> {plan}<span><strong>Estimated turnaround:</strong> {estimate}</span></div>
      </section>

      <form className="dfyRequestForm" onSubmit={submit}>
        <div className="field">
          <label>Service</label>
          <select value={plan} onChange={event => setPlan(event.target.value)}>
            {['Website Setup Consultation','Free Launch Page','Starter Pro','Business','Premium','Extra Page Add-On'].map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="row">
          <div className="field"><label>Your name</label><input required value={form.name} onChange={e => update('name', e.target.value)} /></div>
          <div className="field"><label>Business name</label><input required value={form.business} onChange={e => update('business', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label>Business type</label><input required placeholder="Example: catering, beauty, consulting" value={form.businessType} onChange={e => update('businessType', e.target.value)} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label>Phone, optional</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
          <div className="field"><label>Preferred contact</label><select value={form.contact} onChange={e => update('contact', e.target.value)}><option>Email</option><option>Phone call</option><option>Text message</option></select></div>
        </div>
        <div className="field"><label>What should customers do on your website?</label><input required placeholder="Book, order, buy, call, request a quote..." value={form.customerAction} onChange={e => update('customerAction', e.target.value)} /></div>
        <div className="field"><label>Tell me about the website you want</label><textarea required placeholder="Describe your services, products, pages, colors, photos, and anything important." value={form.details} onChange={e => update('details', e.target.value)} /></div>
        <div className="dfyRequestActions">
          <button className="btn" type="submit">Send My Request</button>
          <Link className="btn light" href="/done-for-you">Back to Services</Link>
          <button className="btn dark" type="button" data-cookie-ai-open="Help me choose a Done-for-You website service.">Ask Cookie AI First</button>
        </div>
        <p className="requestNote">Selecting “Send My Request” opens your email app with the completed request. Review it, then press Send.</p>
      </form>
    </main>
  </>;
}
