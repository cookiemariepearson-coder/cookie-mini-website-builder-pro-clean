import { NextResponse } from 'next/server';
import { normalizeBuilderCheckoutAuthToken, normalizeBuilderCheckoutAuthType } from '../../../../../lib/builderCheckoutAuth.mjs';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import {
  checkoutIntentEmailHash,
  normalizeWebsiteCheckoutIntentId,
  traceWebsiteCheckout,
  websiteCheckoutIntentState
} from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'builder-checkout-auth-confirm', limit: 20, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a moment before trying this secure email link again.');

    const body = await request.json().catch(() => ({}));
    const intentId = normalizeWebsiteCheckoutIntentId(body.intentId);
    const tokenHash = normalizeBuilderCheckoutAuthToken(body.tokenHash);
    const type = normalizeBuilderCheckoutAuthType(body.type);
    if (!intentId || !tokenHash || !type) {
      return NextResponse.json({ ok: false, error: 'This secure email link is incomplete or invalid. Request a new link from Continue Your Website Purchase.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: intent, error: intentError } = await supabase.from('website_checkout_intents').select('*').eq('id', intentId).maybeSingle();
    if (intentError) throw intentError;
    const state = websiteCheckoutIntentState(intent || {});
    if (!state.ok || !state.emailHash) {
      traceWebsiteCheckout('AUTH_CONFIRM_BLOCKED', intent || { id: intentId }, { reasonCode: state.reason === 'expired' ? 'INTENT_EXPIRED' : 'INTENT_INVALID' });
      return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout link expired. Return to Pricing and start the purchase again.' : 'This secure checkout is no longer available.' }, { status: state.reason === 'expired' ? 410 : 403 });
    }

    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    const verifiedEmailHash = checkoutIntentEmailHash(data?.user?.email || '');
    if (error || !data?.session?.access_token || !data?.user?.id || verifiedEmailHash !== state.emailHash) {
      traceWebsiteCheckout('AUTH_CONFIRM_BLOCKED', intent, { reasonCode: error ? 'TOKEN_REJECTED' : 'OWNER_MISMATCH' });
      return NextResponse.json({ ok: false, error: 'This secure email link is invalid or expired. Request a new link from Continue Your Website Purchase.' }, { status: 401 });
    }

    traceWebsiteCheckout('AUTH_CONFIRM_SUCCEEDED', intent);
    return NextResponse.json({ ok: true, accessToken: data.session.access_token }, {
      headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
    });
  } catch (error) {
    console.error('[website-checkout-auth] confirmation failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Your email could not be verified right now. Your website and plan are still saved; please request a new secure link.' }, { status: 500 });
  }
}
