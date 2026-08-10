import { NextResponse } from 'next/server';
import { WEBSITE_CHECKOUTS, cleanCheckoutUrl, websiteCheckoutRoute } from '../../../../../lib/commerceConfig.mjs';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../../lib/siteOwnerAuth';
import { checkoutIntentBelongsToOwner, checkoutIntentEmailHash, normalizeCheckoutDraftSlug, normalizeWebsiteCheckoutIntentId, traceWebsiteCheckout, websiteCheckoutIntentState } from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, reasonCode: 'AUTH_REQUIRED', error: owner.error }, { status: owner.status });
    const body = await request.json();
    const id = normalizeWebsiteCheckoutIntentId(body.intentId);
    const draftSlug = normalizeCheckoutDraftSlug(body.draftSlug);
    if (!id || !draftSlug) return NextResponse.json({ ok: false, error: 'The secure checkout is missing its website information.' }, { status: 400 });
    const { data, error } = await owner.supabase.from('website_checkout_intents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const state = websiteCheckoutIntentState(data || {});
    if (!state.ok) return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout continuation expired. Return to Pricing to start again.' : 'This checkout continuation was already used.' }, { status: state.reason === 'used' ? 409 : 410 });
    if ((state.ownerId || state.emailHash) && !checkoutIntentBelongsToOwner(data, owner)) return NextResponse.json({ ok: false, error: 'This checkout belongs to a different verified customer.' }, { status: 403 });
    if (state.draftSlug && state.draftSlug !== draftSlug) return NextResponse.json({ ok: false, error: 'This checkout is attached to a different website draft.' }, { status: 409 });

    const { data: website, error: websiteError } = await owner.supabase.from('websites').select('id,owner_id,customer_email,plan').eq('slug', draftSlug).maybeSingle();
    if (websiteError) throw websiteError;
    if (!website || !siteBelongsToOwner(website, owner)) return NextResponse.json({ ok: false, error: 'Save this website securely before continuing to checkout.' }, { status: 403 });
    if (state.plan === 'extra' && !['starter', 'business'].includes(String(website.plan || '').toLowerCase())) {
      return NextResponse.json({ ok: false, error: 'The Extra Page Add-On requires an active Starter Pro or Business website.' }, { status: 409 });
    }

    const config = WEBSITE_CHECKOUTS[state.plan];
    const checkoutUrl = cleanCheckoutUrl(process.env[config.envName] || '');
    if (!checkoutUrl) {
      traceWebsiteCheckout('CHECKOUT_REDIRECT_BLOCKED', data, { reasonCode: 'MISSING_PRODUCT_CONFIGURATION' });
      console.error('[website-checkout-intent] checkout configuration missing', { plan: state.plan, environmentVariable: config.envName });
      return NextResponse.json({ ok: false, error: 'Secure checkout is temporarily unavailable. Your draft and plan selection are still saved.' }, { status: 503 });
    }

    const now = new Date().toISOString();
    const { data: started, error: updateError } = await owner.supabase
      .from('website_checkout_intents')
      .update({
        owner_id: owner.user.id,
        email_hash: checkoutIntentEmailHash(owner.email),
        draft_slug: draftSlug,
        website_id: website.id,
        status: 'checkout_started',
        authenticated_at: data.authenticated_at || now,
        checkout_started_at: now
      })
      .eq('id', id)
      .in('status', ['pending_auth', 'ready'])
      .select('id')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!started) return NextResponse.json({ ok: false, error: 'This checkout continuation was already used.' }, { status: 409 });
    traceWebsiteCheckout('GUMROAD_PRODUCT_SELECTED', { ...data, status: 'checkout_started' });
    return NextResponse.json({ ok: true, plan: state.plan, checkoutPath: websiteCheckoutRoute(state.plan) });
  } catch (error) {
    console.error('[website-checkout-intent] continue failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The secure checkout could not continue. Your draft is still safe. Please try again shortly.' }, { status: 500 });
  }
}
