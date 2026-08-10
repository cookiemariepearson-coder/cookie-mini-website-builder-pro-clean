import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import {
  newWebsiteCheckoutIntent,
  normalizeCheckoutDraftSlug,
  normalizeWebsiteCheckoutIntentId,
  normalizeWebsiteCheckoutPlan,
  websiteCheckoutIntentState
} from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'website-checkout-intent-start', limit: 30, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a moment before starting another checkout.');
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    const existingIntentId = normalizeWebsiteCheckoutIntentId(body.intentId);
    if (existingIntentId) {
      const draftSlug = normalizeCheckoutDraftSlug(body.draftSlug);
      if (!draftSlug) return NextResponse.json({ ok: false, error: 'Add a website name before continuing to checkout.' }, { status: 400 });
      const { data: existing, error: lookupError } = await supabase.from('website_checkout_intents').select('*').eq('id', existingIntentId).maybeSingle();
      if (lookupError) throw lookupError;
      const state = websiteCheckoutIntentState(existing || {});
      if (!state.ok) return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout continuation expired. Return to Pricing to start again.' : 'This checkout continuation is no longer available.' }, { status: 410 });
      if (existing.owner_id || existing.email_hash) return NextResponse.json({ ok: false, error: 'This checkout is already attached to a verified customer.' }, { status: 409 });
      const requestedPlan = normalizeWebsiteCheckoutPlan(body.plan);
      if (requestedPlan && requestedPlan !== state.plan) return NextResponse.json({ ok: false, error: 'The selected plan does not match this secure checkout.' }, { status: 409 });
      const { data: prepared, error: updateError } = await supabase
        .from('website_checkout_intents')
        .update({ draft_slug: draftSlug })
        .eq('id', existingIntentId)
        .eq('status', 'pending_auth')
        .is('owner_id', null)
        .is('email_hash', null)
        .select('id,plan,draft_slug,expires_at')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!prepared) return NextResponse.json({ ok: false, error: 'This checkout could not be prepared for authentication.' }, { status: 409 });
      return NextResponse.json({ ok: true, intentId: prepared.id, plan: prepared.plan, draftSlug: prepared.draft_slug, expiresAt: prepared.expires_at });
    }
    const intent = newWebsiteCheckoutIntent({ plan: body.plan, draftSlug: body.draftSlug });
    if (!intent) return NextResponse.json({ ok: false, error: 'Choose Starter Pro, Business, Premium, or the Extra Page Add-On.' }, { status: 400 });

    const { error } = await supabase.from('website_checkout_intents').insert(intent);
    if (error) throw error;
    return NextResponse.json({ ok: true, intentId: intent.id, plan: intent.plan, expiresAt: intent.expires_at });
  } catch (error) {
    console.error('[website-checkout-intent] start failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The secure checkout could not start. Your draft is still safe. Please try again shortly.' }, { status: 500 });
  }
}
