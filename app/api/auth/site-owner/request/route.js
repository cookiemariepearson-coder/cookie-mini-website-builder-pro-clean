import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { safeCustomerReturnPath } from '../../../../../lib/commerceConfig.mjs';
import {
  checkoutIntentEmailHash,
  checkoutIntentRequestFromReturnPath,
  newWebsiteCheckoutIntent,
  normalizeCheckoutDraftSlug,
  normalizeWebsiteCheckoutIntentId,
  traceWebsiteCheckout,
  websiteCheckoutIntentState
} from '../../../../../lib/websiteCheckoutIntent.mjs';

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
    const origin = requestUrl.hostname === rootDomain || requestUrl.hostname === `www.${rootDomain}`
      ? `https://www.${rootDomain}`
      : requestUrl.origin;
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

    const redirectTo = intentId
      ? `${origin}/customer/auth/callback?intent=${encodeURIComponent(intentId)}`
      : `${origin}/customer/auth/callback?return=${encodeURIComponent(returnPath)}`;
    if (intentId) traceWebsiteCheckout('AUTH_EMAIL_REQUESTED', intentForTrace || { id: intentId, status: 'pending_auth' });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });

    if (error) throw error;
    if (intentId) traceWebsiteCheckout('AUTH_EMAIL_PROVIDER_ACCEPTED', intentForTrace || { id: intentId, status: 'pending_auth' });
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
