import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { safeCustomerReturnPath } from '../../../../../lib/commerceConfig.mjs';
import { builderCheckoutConfirmationUrl, builderCustomerConfirmationUrl, canonicalBuilderOrigin } from '../../../../../lib/builderCheckoutAuth.mjs';
import { sendResendEmail } from '../../../../../lib/resendEmail.mjs';
import {
  checkoutIntentEmailHash,
  checkoutIntentRequestFromReturnPath,
  newWebsiteCheckoutIntent,
  normalizeCheckoutDraftSlug,
  normalizeWebsiteCheckoutIntentId,
  traceWebsiteCheckout,
  websiteCheckoutCorrelationId,
  websiteCheckoutIntentState
} from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHECKOUT_PLAN_LABELS = Object.freeze({
  starter: 'Starter Pro — $19/month',
  business: 'Business — $30/month',
  premium: 'Premium — $50/month',
  extra: 'Extra Page Add-On — $10/month per page'
});

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    const ipLimited = rateLimit(req, { name: 'customer-auth-ip', limit: 10, windowMs: 15 * 60 * 1000 });
    const emailLimited = rateLimit(req, { name: 'customer-auth-email', limit: 5, windowMs: 15 * 60 * 1000, subject: email });
    if (!ipLimited.ok || !emailLimited.ok) return rateLimitResponse(!ipLimited.ok ? ipLimited : emailLimited, 'Please wait before requesting another sign-in email. You can also check your spam folder.');

    const requestUrl = new URL(req.url);
    const rootDomain = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').trim().toLowerCase();
    const origin = canonicalBuilderOrigin(requestUrl, rootDomain);
    const returnPath = safeCustomerReturnPath(body.returnPath);
    const supabase = getSupabaseAdmin();
    let intentId = normalizeWebsiteCheckoutIntentId(body.intentId);
    const requestedDraftSlug = normalizeCheckoutDraftSlug(body.draftSlug);
    const legacyIntent = checkoutIntentRequestFromReturnPath(returnPath);
    let intentForTrace = null;

    if (intentId) {
      const { data: currentIntent, error: intentLookupError } = await supabase.from('website_checkout_intents').select('*').eq('id', intentId).maybeSingle();
      if (intentLookupError) throw intentLookupError;
      intentForTrace = currentIntent;
      const state = websiteCheckoutIntentState(currentIntent || {});
      if (!state.ok) return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout continuation expired. Return to Pricing to start again.' : 'This checkout continuation is no longer available.' }, { status: 410 });
      const emailHash = checkoutIntentEmailHash(email);
      if ((state.emailHash && state.emailHash !== emailHash) || state.ownerId) {
        return NextResponse.json({ ok: false, error: 'This checkout is already attached to a different verified customer.' }, { status: 403 });
      }
      if (state.draftSlug && requestedDraftSlug && state.draftSlug !== requestedDraftSlug) {
        return NextResponse.json({ ok: false, error: 'This checkout is attached to a different website draft.' }, { status: 409 });
      }
      const { error: bindError } = await supabase.from('website_checkout_intents').update({
        email_hash: emailHash,
        draft_slug: state.draftSlug || requestedDraftSlug || null
      }).eq('id', intentId).eq('status', 'pending_auth');
      if (bindError) throw bindError;
    } else if (legacyIntent) {
      const intent = newWebsiteCheckoutIntent({ plan: legacyIntent.plan, draftSlug: legacyIntent.draftSlug, email });
      const { error: createError } = await supabase.from('website_checkout_intents').insert(intent);
      if (createError) throw createError;
      intentId = intent.id;
      intentForTrace = intent;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
    if (!apiKey || !from) {
      if (intentId) {
        traceWebsiteCheckout('CHECKOUT_AUTH_EMAIL_BLOCKED', intentForTrace || { id: intentId, status: 'pending_auth' }, { reasonCode: 'EMAIL_CONFIGURATION_UNAVAILABLE' });
      }
      console.error('[website-checkout-auth] customer email configuration unavailable');
      return NextResponse.json({ ok: false, error: intentId
        ? 'The secure checkout email is temporarily unavailable. Your plan and website are still saved; please try again shortly.'
        : 'The secure sign-in email is temporarily unavailable. Please try again shortly.' }, { status: 503 });
    }

    if (intentId) {
      traceWebsiteCheckout('AUTH_EMAIL_REQUESTED', intentForTrace || { id: intentId, status: 'pending_auth' });
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email
      });
      if (linkError) throw linkError;

      const confirmationUrl = builderCheckoutConfirmationUrl({
        origin,
        intentId,
        tokenHash: linkData?.properties?.hashed_token,
        type: linkData?.properties?.verification_type
      });
      if (!confirmationUrl) throw new Error('Builder checkout authentication link could not be generated.');

      const currentState = websiteCheckoutIntentState(intentForTrace || {});
      const planLabel = CHECKOUT_PLAN_LABELS[currentState.plan] || 'Paid website plan';
      const websiteLabel = currentState.draftSlug || requestedDraftSlug || 'your saved Builder website';
      const correlationId = websiteCheckoutCorrelationId(intentId);
      await sendResendEmail({
        apiKey,
        from,
        to: email,
        replyTo: process.env.ADMIN_NOTIFICATION_EMAIL || undefined,
        notification: 'builder-checkout-auth',
        requestId: correlationId,
        idempotencyKey: `builder-checkout-auth-${correlationId}-${Date.now().toString(36)}`,
        subject: 'Continue your Cookie Mini Website Builder checkout',
        html: `<h2>Continue your secure website checkout</h2><p><strong>Plan:</strong> ${escapeHtml(planLabel)}<br><strong>Website:</strong> ${escapeHtml(websiteLabel)}</p><p>Use the secure button below to verify this email and continue the exact saved purchase in Cookie Mini Website Builder Pro.</p><p><a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Verify Email and Continue Checkout</a></p><p>This one-time link expires shortly. If you did not request it, you can ignore this email.</p><p>Questions? Contact hello@cookiesdigitalcreations.com.</p>`
      });
      traceWebsiteCheckout('AUTH_EMAIL_PROVIDER_ACCEPTED', intentForTrace || { id: intentId, status: 'pending_auth' });
    } else {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email
      });
      if (linkError) throw linkError;
      const confirmationUrl = builderCustomerConfirmationUrl({
        origin,
        returnPath,
        tokenHash: linkData?.properties?.hashed_token,
        type: linkData?.properties?.verification_type
      });
      if (!confirmationUrl) throw new Error('Builder customer authentication link could not be generated.');
      const authCorrelationId = checkoutIntentEmailHash(email).slice(0, 16);
      await sendResendEmail({
        apiKey,
        from,
        to: email,
        replyTo: process.env.ADMIN_NOTIFICATION_EMAIL || undefined,
        notification: 'builder-customer-auth',
        requestId: authCorrelationId,
        idempotencyKey: `builder-customer-auth-${authCorrelationId}-${Date.now().toString(36)}`,
        subject: 'Open your Cookie Mini Website Builder drafts',
        html: `<h2>Open My Drafts securely</h2><p>Use the secure button below to verify your email and return to Cookie Mini Website Builder Pro.</p><p><a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Verify Email and Open My Drafts</a></p><p>This one-time link expires shortly. If you did not request it, you can ignore this email.</p><p>Questions? Contact hello@cookiesdigitalcreations.com.</p>`
      });
      console.info('[builder-customer-auth]', { event: 'AUTH_EMAIL_PROVIDER_ACCEPTED', returnTarget: returnPath === '/customer' ? 'drafts' : returnPath === '/video-studio' ? 'video-studio' : 'builder' });
    }
    return NextResponse.json({
      ok: true,
      checkoutIntentSaved: Boolean(intentId),
      message: intentId
        ? 'Check your email and tap the secure sign-in link. Your selected plan and website are saved, and checkout will continue after verification.'
        : 'Check your email and tap the secure sign-in link. You can then manage websites saved with that email.'
    });
  } catch (error) {
    console.error('Customer sign-in request failed', error);
    return NextResponse.json({ ok: false, error: 'The secure email link could not be sent. Please try again shortly.' }, { status: 500 });
  }
}
