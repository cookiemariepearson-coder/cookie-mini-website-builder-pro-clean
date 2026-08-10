import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner } from '../../../../../lib/siteOwnerAuth';
import { checkoutIntentBelongsToOwner, normalizeWebsiteCheckoutIntentId, websiteCheckoutIntentState } from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const id = normalizeWebsiteCheckoutIntentId(new URL(request.url).searchParams.get('id'));
    if (!id) return NextResponse.json({ ok: false, error: 'This checkout continuation is invalid.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('website_checkout_intents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const state = websiteCheckoutIntentState(data || {});
    if (!state.ok) return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout continuation expired. Return to Pricing to start again.' : 'This checkout continuation is no longer available.' }, { status: 410 });

    if (state.emailHash || state.ownerId) {
      const owner = await getVerifiedSiteOwner(request);
      if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
      if (!checkoutIntentBelongsToOwner(data, owner)) return NextResponse.json({ ok: false, error: 'This checkout belongs to a different verified customer.' }, { status: 403 });
    }
    return NextResponse.json({ ok: true, intentId: state.id, plan: state.plan, draftSlug: state.draftSlug, status: state.status });
  } catch (error) {
    console.error('[website-checkout-intent] status failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The secure checkout status could not be loaded. Please try again shortly.' }, { status: 500 });
  }
}
