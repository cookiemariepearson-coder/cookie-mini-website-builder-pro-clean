import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const services = {
  'Website Setup Consultation': { setup: 'Consultation request', monthly: 'Not applicable', turnaround: 'Confirmed after review', checkoutEnv: '' },
  'Free Launch Page': { setup: '$99 one-time setup', monthly: '$0/month', turnaround: '3–5 business days', checkoutEnv: 'DFY_FREE_LAUNCH_CHECKOUT_URL' },
  'Starter Pro': { setup: '$249 one-time setup', monthly: '$19/month', turnaround: '5–7 business days', checkoutEnv: 'DFY_STARTER_CHECKOUT_URL' },
  Business: { setup: '$499 one-time setup', monthly: '$30/month', turnaround: '7–10 business days', checkoutEnv: 'DFY_BUSINESS_CHECKOUT_URL' },
  Premium: { setup: '$899 one-time setup', monthly: '$50/month', turnaround: '10–14 business days', checkoutEnv: 'DFY_PREMIUM_CHECKOUT_URL' },
  'Extra Page Add-On': { setup: '$125 one-time setup', monthly: '$10/month per extra page', turnaround: '3–5 business days', checkoutEnv: 'DFY_EXTRA_PAGE_CHECKOUT_URL' }
};

const recentRequests = globalThis.__cookieDfyRecentRequests || new Map();
globalThis.__cookieDfyRecentRequests = recentRequests;

function clean(value = '', max = 1200) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function escapeHtml(value = '') {
  return clean(value, 5000).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function sendEmail({ apiKey, from, to, subject, html, replyTo }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, reply_to: replyTo })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `Email delivery failed (${response.status}).`);
  return data;
}

export async function POST(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for') || '';
    const clientKey = forwarded.split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const lastRequest = recentRequests.get(clientKey) || 0;
    if (now - lastRequest < 30000) {
      return NextResponse.json({ ok: false, error: 'Your request was already submitted. Please wait before trying again.' }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    if (body.companyWebsite) return NextResponse.json({ ok: true });

    const plan = clean(body.plan, 80);
    const service = services[plan];
    const form = {
      name: clean(body.name, 160),
      business: clean(body.business, 200),
      businessType: clean(body.businessType, 200),
      email: clean(body.email, 250).toLowerCase(),
      phone: clean(body.phone, 80),
      customerAction: clean(body.customerAction, 400),
      details: clean(body.details, 2500),
      contact: clean(body.contact, 60)
    };

    if (!service || !form.name || !form.business || !form.businessType || !form.email || !form.customerAction || !form.details) {
      return NextResponse.json({ ok: false, error: 'Complete every required field and choose a valid service.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid customer email address.' }, { status: 400 });
    }
    recentRequests.set(clientKey, now);

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
    if (!apiKey || !adminEmail || !from) {
      return NextResponse.json({ ok: false, error: 'Email confirmation is temporarily unavailable. Please try again shortly.' }, { status: 503 });
    }

    const checkoutUrl = service.checkoutEnv ? clean(process.env[service.checkoutEnv], 1000) : '';
    const requestId = `DFY-${Date.now().toString(36).toUpperCase()}`;
    const safe = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, escapeHtml(value)]));
    const checkoutBlock = checkoutUrl
      ? `<p><a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Continue to secure checkout</a></p><p>Your place in the build schedule is confirmed after payment is completed.</p>`
      : plan === 'Website Setup Consultation'
        ? '<p>No payment is due for submitting this consultation request. Cookie Digital Creations will review it and contact you.</p>'
        : '<p>Your request was received. Cookie Digital Creations will send the secure setup-payment link before work begins.</p>';

    const detailRows = `
      <p><strong>Request:</strong> ${requestId}</p>
      <p><strong>Service:</strong> ${escapeHtml(plan)}</p>
      <p><strong>Setup:</strong> ${escapeHtml(service.setup)}<br><strong>Ongoing plan:</strong> ${escapeHtml(service.monthly)}<br><strong>Estimated turnaround:</strong> ${escapeHtml(service.turnaround)}</p>
      <p><strong>Name:</strong> ${safe.name}<br><strong>Business:</strong> ${safe.business}<br><strong>Business type:</strong> ${safe.businessType}<br><strong>Email:</strong> ${safe.email}<br><strong>Phone:</strong> ${safe.phone || 'Not provided'}<br><strong>Preferred contact:</strong> ${safe.contact}</p>
      <p><strong>Customer action:</strong> ${safe.customerAction}</p>
      <p><strong>Website details:</strong><br>${safe.details.replace(/\n/g, '<br>')}</p>`;

    await Promise.all([
      sendEmail({
        apiKey,
        from,
        to: adminEmail,
        replyTo: form.email,
        subject: `Done-for-You request: ${plan} — ${form.business}`,
        html: `<h2>New Done-for-You Website Request</h2>${detailRows}<p><strong>Checkout configured:</strong> ${checkoutUrl ? 'Yes' : 'No'}</p>`
      }),
      sendEmail({
        apiKey,
        from,
        to: form.email,
        replyTo: adminEmail,
        subject: `We received your ${plan} website request`,
        html: `<h2>Thank you, ${safe.name}!</h2><p>Cookie Digital Creations received your Done-for-You website request.</p>${detailRows}<h3>What happens next</h3><ol><li>Complete the secure checkout when prompted.</li><li>Gather your logo, wording, photos, services, prices, and customer-action links.</li><li>Cookie Digital Creations reviews your information and contacts you if anything is missing.</li><li>Your turnaround begins after payment and required content are received.</li></ol>${checkoutBlock}<p>Questions? Reply to this email or contact hello@cookiesdigitalcreations.com.</p>`
      })
    ]);

    return NextResponse.json({
      ok: true,
      requestId,
      checkoutUrl,
      checkoutRequired: Boolean(service.checkoutEnv),
      checkoutConfigured: Boolean(checkoutUrl),
      turnaround: service.turnaround
    });
  } catch (error) {
    console.error('[done-for-you] request failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The request could not be completed. Please try again or contact hello@cookiesdigitalcreations.com.' }, { status: 500 });
  }
}
