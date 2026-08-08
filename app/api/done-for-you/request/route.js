import { NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { cleanCheckoutUrl, DFY_CHECKOUT_ENV_BY_SERVICE } from '../../../../lib/commerceConfig.mjs';
import { sendResendEmail } from '../../../../lib/resendEmail.mjs';
import { createCustomerRequest, updateCustomerRequest } from '../../../../lib/customerRequestStore.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const services = {
  'Website Setup Consultation': { setup: 'Consultation request', monthly: 'Not applicable', turnaround: 'Confirmed after review', checkoutEnv: '' },
  'Free Launch Page': { setup: '$99 one-time setup', monthly: '$0/month', turnaround: '3–5 business days', checkoutEnv: DFY_CHECKOUT_ENV_BY_SERVICE['Free Launch Page'] },
  'Starter Pro': { setup: '$249 one-time setup', monthly: '$19/month', turnaround: '5–7 business days', checkoutEnv: DFY_CHECKOUT_ENV_BY_SERVICE['Starter Pro'] },
  Business: { setup: '$499 one-time setup', monthly: '$30/month', turnaround: '7–10 business days', checkoutEnv: DFY_CHECKOUT_ENV_BY_SERVICE.Business },
  Premium: { setup: '$899 one-time setup', monthly: '$50/month', turnaround: '10–14 business days', checkoutEnv: DFY_CHECKOUT_ENV_BY_SERVICE.Premium },
  'Extra Page Add-On': { setup: '$125 one-time setup', monthly: '$10/month per extra page', turnaround: '3–5 business days', checkoutEnv: DFY_CHECKOUT_ENV_BY_SERVICE['Extra Page Add-On'] }
};

function clean(value = '', max = 1200) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function escapeHtml(value = '') {
  return clean(value, 5000).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function POST(request) {
  try {
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
    const ipLimited = rateLimit(request, { name: 'done-for-you-ip', limit: 10, windowMs: 60 * 60 * 1000 });
    const emailLimited = rateLimit(request, { name: 'done-for-you-email', limit: 5, windowMs: 60 * 60 * 1000, subject: form.email });
    if (!ipLimited.ok || !emailLimited.ok) return rateLimitResponse(!ipLimited.ok ? ipLimited : emailLimited, 'Your request was already received. Please wait before submitting another request.');

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
    if (!apiKey || !adminEmail || !from) {
      return NextResponse.json({ ok: false, error: 'Email confirmation is temporarily unavailable. Please try again shortly.' }, { status: 503 });
    }

    const checkoutUrl = service.checkoutEnv ? cleanCheckoutUrl(process.env[service.checkoutEnv]) : '';
    if (service.checkoutEnv && !checkoutUrl) {
      console.error('[done-for-you] checkout URL missing or invalid', { plan, environmentVariable: service.checkoutEnv });
    }
    const requestId = `DFY-${Date.now().toString(36).toUpperCase()}`;
    const storedRequest = await createCustomerRequest({
      request_id: requestId,
      request_type: 'done-for-you',
      service: plan,
      customer_name: form.name,
      business_name: form.business,
      business_type: form.businessType,
      customer_email: form.email,
      phone: form.phone || null,
      preferred_contact: form.contact,
      customer_action: form.customerAction,
      details: form.details,
      checkout_required: Boolean(service.checkoutEnv),
      checkout_configured: Boolean(checkoutUrl),
      notification_status: 'pending'
    });
    if (!storedRequest.ok) {
      console.error(JSON.stringify({ level: 'error', event: 'customer_request_storage_failed', requestId, requestType: 'done-for-you', status: storedRequest.status, configurationMissing: Boolean(storedRequest.missing) }));
    } else {
      console.log(JSON.stringify({ level: 'info', event: 'customer_request_stored', requestId, requestType: 'done-for-you' }));
    }
    const safe = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, escapeHtml(value)]));
    const checkoutBlock = checkoutUrl
      ? `<p><a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Continue to secure checkout</a></p><p>Your place in the build schedule is confirmed after payment is completed.</p>`
      : service.checkoutEnv
        ? '<p>Your request is safely received. Secure checkout is temporarily unavailable, so Cookie Digital Creations will contact you with the correct payment step. You have not been charged.</p>'
        : '<p>No payment is due for submitting this consultation request. Cookie Digital Creations will review it and contact you.</p>';
    const nextSteps = checkoutUrl
      ? '<ol><li>Complete the secure checkout using the button below.</li><li>Gather your logo, wording, photos, services, prices, and customer-action links.</li><li>Cookie Digital Creations reviews your information and contacts you if anything is missing.</li><li>Your turnaround begins after payment and required content are received.</li></ol>'
      : '<ol><li>Gather your logo, wording, photos, services, prices, and customer-action links.</li><li>Cookie Digital Creations will review your request and contact you with the correct next step.</li><li>Your turnaround begins after any required payment and content are received.</li></ol>';

    const detailRows = `
      <p><strong>Request:</strong> ${requestId}</p>
      <p><strong>Service:</strong> ${escapeHtml(plan)}</p>
      <p><strong>Setup:</strong> ${escapeHtml(service.setup)}<br><strong>Ongoing plan:</strong> ${escapeHtml(service.monthly)}<br><strong>Estimated turnaround:</strong> ${escapeHtml(service.turnaround)}</p>
      <p><strong>Name:</strong> ${safe.name}<br><strong>Business:</strong> ${safe.business}<br><strong>Business type:</strong> ${safe.businessType}<br><strong>Email:</strong> ${safe.email}<br><strong>Phone:</strong> ${safe.phone || 'Not provided'}<br><strong>Preferred contact:</strong> ${safe.contact}</p>
      <p><strong>Customer action:</strong> ${safe.customerAction}</p>
      <p><strong>Website details:</strong><br>${safe.details.replace(/\n/g, '<br>')}</p>`;

    let adminNotification;
    let customerNotification;
    try {
      [adminNotification, customerNotification] = await Promise.all([
      sendResendEmail({
        apiKey,
        from,
        to: adminEmail,
        replyTo: form.email,
        notification: 'dfy-admin',
        requestId,
        idempotencyKey: `dfy-admin-${requestId}`,
        subject: `Done-for-You request: ${plan} — ${form.business}`,
        html: `<h2>New Done-for-You Website Request</h2>${detailRows}<p><strong>Checkout configured:</strong> ${checkoutUrl ? 'Yes' : 'No'}</p>`
      }),
      sendResendEmail({
        apiKey,
        from,
        to: form.email,
        replyTo: adminEmail,
        notification: 'dfy-customer',
        requestId,
        idempotencyKey: `dfy-customer-${requestId}`,
        subject: `We received your ${plan} website request`,
        html: `<h2>Thank you, ${safe.name}!</h2><p>Cookie Digital Creations received your Done-for-You website request.</p>${detailRows}<h3>What happens next</h3>${nextSteps}${checkoutBlock}<p>Questions? Reply to this email or contact hello@cookiesdigitalcreations.com.</p>`
      })
      ]);
      if (storedRequest.ok) await updateCustomerRequest(requestId, {
        notification_status: 'accepted',
        admin_provider_message_id: adminNotification.id || null,
        customer_provider_message_id: customerNotification.id || null,
        notification_error: null
      });
    } catch (emailError) {
      if (storedRequest.ok) await updateCustomerRequest(requestId, {
        notification_status: 'rejected',
        notification_error: String(emailError?.message || 'Provider rejected notification').slice(0, 500)
      });
      throw emailError;
    }

    return NextResponse.json({
      ok: true,
      requestId,
      checkoutUrl,
      checkoutRequired: Boolean(service.checkoutEnv),
      checkoutConfigured: Boolean(checkoutUrl),
      notificationsAccepted: Boolean(adminNotification.accepted && customerNotification.accepted),
      requestStored: Boolean(storedRequest.ok),
      turnaround: service.turnaround
    });
  } catch (error) {
    console.error('[done-for-you] request failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The request could not be completed. Please try again or contact hello@cookiesdigitalcreations.com.' }, { status: 500 });
  }
}
