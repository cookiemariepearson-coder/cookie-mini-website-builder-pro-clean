import { NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clean(value = '', max = 2000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function escapeHtml(value = '') {
  return clean(value, 5000).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.companyWebsite) return NextResponse.json({ ok: true });

    const form = {
      name: clean(body.name, 160),
      email: clean(body.email, 250).toLowerCase(),
      website: clean(body.website, 160),
      message: clean(body.message, 3000)
    };
    if (!form.name || !form.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return NextResponse.json({ ok: false, error: 'Enter your name, a valid email address, and a short message.' }, { status: 400 });
    }

    const ipLimited = rateLimit(request, { name: 'contact-ip', limit: 10, windowMs: 60 * 60 * 1000 });
    const emailLimited = rateLimit(request, { name: 'contact-email', limit: 5, windowMs: 60 * 60 * 1000, subject: form.email });
    if (!ipLimited.ok || !emailLimited.ok) return rateLimitResponse(!ipLimited.ok ? ipLimited : emailLimited, 'Your message was already received. Please wait before sending another one.');

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
    const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'hello@cookiesdigitalcreations.com';
    if (!apiKey || !from) {
      console.error('[contact] email configuration unavailable');
      return NextResponse.json({ ok: false, error: 'The contact form is temporarily unavailable. Please email hello@cookiesdigitalcreations.com.' }, { status: 503 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: form.email,
        subject: `Mini Builder support: ${form.website || form.name}`,
        html: `<h2>Cookie Mini Website Builder support request</h2><p><strong>Name:</strong> ${escapeHtml(form.name)}<br><strong>Email:</strong> ${escapeHtml(form.email)}<br><strong>Website:</strong> ${escapeHtml(form.website || 'Not provided')}</p><p><strong>Message:</strong><br>${escapeHtml(form.message).replace(/\n/g, '<br>')}</p>`
      })
    });
    if (!response.ok) {
      const provider = await response.json().catch(() => ({}));
      console.error('[contact] email delivery failed', { status: response.status, code: provider?.name || provider?.code || '' });
      return NextResponse.json({ ok: false, error: 'Your message could not be sent. Please email hello@cookiesdigitalcreations.com.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: 'Your message was sent. Cookie Digital Creations will reply by email.' });
  } catch (error) {
    console.error('[contact] submission failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Your message could not be sent. Please email hello@cookiesdigitalcreations.com.' }, { status: 500 });
  }
}
