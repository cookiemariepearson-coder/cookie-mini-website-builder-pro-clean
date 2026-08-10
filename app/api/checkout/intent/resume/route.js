import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../../lib/siteOwnerAuth';
import { checkoutIntentBelongsToOwner, checkoutIntentBuilderPath, normalizeWebsiteCheckoutIntentId, traceWebsiteCheckout, websiteCheckoutIntentState } from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, reasonCode: 'AUTH_REQUIRED', error: owner.error }, { status: owner.status });
    const body = await request.json();
    const id = normalizeWebsiteCheckoutIntentId(body.intentId);
    if (!id) return NextResponse.json({ ok: false, error: 'This checkout continuation is invalid.' }, { status: 400 });
    const { data, error } = await owner.supabase.from('website_checkout_intents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const state = websiteCheckoutIntentState(data || {});
    if (!state.ok) return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout continuation expired. Return to Pricing to start again.' : 'This checkout continuation is no longer available.' }, { status: 410 });
    if (!checkoutIntentBelongsToOwner(data, owner)) return NextResponse.json({ ok: false, error: 'This checkout belongs to a different verified customer.' }, { status: 403 });

    if (state.draftSlug) {
      const { data: website, error: websiteError } = await owner.supabase.from('websites').select('id,owner_id,customer_email').eq('slug', state.draftSlug).maybeSingle();
      if (websiteError) throw websiteError;
      if (website && !siteBelongsToOwner(website, owner)) return NextResponse.json({ ok: false, error: 'This website belongs to a different verified customer.' }, { status: 403 });
    }

    const { data: ready, error: updateError } = await owner.supabase
      .from('website_checkout_intents')
      .update({ owner_id: owner.user.id, status: 'ready', authenticated_at: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['pending_auth', 'ready'])
      .select('*')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!ready) return NextResponse.json({ ok: false, error: 'This checkout continuation was already used.' }, { status: 409 });
    traceWebsiteCheckout('AUTH_CALLBACK_INTENT_RESUMED', ready);
    return NextResponse.json({ ok: true, plan: ready.plan, draftSlug: ready.draft_slug || '', builderPath: checkoutIntentBuilderPath(ready, { resume: true }) });
  } catch (error) {
    console.error('[website-checkout-intent] resume failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Your email was verified, but the secure checkout could not resume. Open My Website to use Continue Purchase.' }, { status: 500 });
  }
}
