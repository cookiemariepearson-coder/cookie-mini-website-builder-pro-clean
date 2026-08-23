import { NextResponse } from 'next/server';
import { WEBSITE_CHECKOUTS, cleanCheckoutUrl, websiteCheckoutRoute } from '../../../../../lib/commerceConfig.mjs';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../../lib/siteOwnerAuth';
import { checkoutIntentBelongsToOwner, checkoutIntentEmailHash, normalizeCheckoutDraftSlug, normalizeWebsiteCheckoutIntentId, traceWebsiteCheckout, websiteCheckoutIntentState } from '../../../../../lib/websiteCheckoutIntent.mjs';
import { normalizeWebsitePlan } from '../../../../../lib/websitePublishPolicy.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, reasonCode: 'AUTH_REQUIRED', error: owner.error }, { status: owner.status });
    const body = await request.json();
    const id = normalizeWebsiteCheckoutIntentId(body.intentId);
    const draftSlug = normalizeCheckoutDraftSlug(body.draftSlug);
    const websiteId = String(body.websiteId || '').trim();
    if (websiteId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(websiteId)) {
      return NextResponse.json({ ok: false, error: 'Invalid website reference.' }, { status: 400 });
    }
    if (!id || !draftSlug) return NextResponse.json({ ok: false, error: 'The secure checkout is missing its website information.' }, { status: 400 });
    const { data, error } = await owner.supabase.from('website_checkout_intents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const state = websiteCheckoutIntentState(data || {});
    if (!state.ok) return NextResponse.json({ ok: false, error: state.reason === 'expired' ? 'This checkout continuation expired. Return to Pricing to start again.' : 'This checkout continuation was already used.' }, { status: state.reason === 'used' ? 409 : 410 });
    if ((state.ownerId || state.emailHash) && !checkoutIntentBelongsToOwner(data, owner)) return NextResponse.json({ ok: false, error: 'This checkout belongs to a different verified customer.' }, { status: 403 });
    if (state.draftSlug && state.draftSlug !== draftSlug) return NextResponse.json({ ok: false, error: 'This checkout is attached to a different website draft.' }, { status: 409 });

    let websiteQuery = owner.supabase.from('websites').select('id,slug,owner_id,customer_email,plan,site');
    websiteQuery = websiteId ? websiteQuery.eq('id', websiteId) : websiteQuery.eq('slug', draftSlug);
    const { data: website, error: websiteError } = await websiteQuery.maybeSingle();
    if (websiteError) throw websiteError;
    if (!website || !siteBelongsToOwner(website, owner)) return NextResponse.json({ ok: false, error: 'Save this website securely before continuing to checkout.' }, { status: 403 });
    if (website.slug && normalizeCheckoutDraftSlug(website.slug) !== draftSlug) return NextResponse.json({ ok: false, error: 'This checkout is attached to a different website draft.' }, { status: 409 });
    if (data.website_id && data.website_id !== website.id) return NextResponse.json({ ok: false, error: 'This checkout is attached to a different website.' }, { status: 409 });
    const savedPlan = normalizeWebsitePlan(website.plan) || normalizeWebsitePlan(website.site?.plan);
    if (state.plan !== 'extra' && savedPlan !== state.plan) {
      traceWebsiteCheckout('CHECKOUT_REDIRECT_BLOCKED', data, { websiteId: website.id, ownerId: owner.user.id, storedPlan: website.plan, builderPlan: website.site?.plan, intentPlan: state.plan, product: state.plan, reasonCode: 'WEBSITE_PLAN_MISMATCH' });
      return NextResponse.json({ ok: false, error: 'The saved website plan does not match this secure checkout.' }, { status: 409 });
    }
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
    traceWebsiteCheckout('GUMROAD_PRODUCT_SELECTED', { ...data, status: 'checkout_started' }, { websiteId: website.id, ownerId: owner.user.id, storedPlan: website.plan, builderPlan: website.site?.plan, intentPlan: state.plan, product: state.plan, entitlementState: 'unverified_checkout_only' });
    const response = NextResponse.json({ ok: true, plan: state.plan, checkoutPath: `${websiteCheckoutRoute(state.plan)}?intent=${encodeURIComponent(id)}` });
    response.cookies.set('cookieWebsiteCheckoutReturn', id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60 * 60
    });
    return response;
  } catch (error) {
    console.error('[website-checkout-intent] continue failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The secure checkout could not continue. Your draft is still safe. Please try again shortly.' }, { status: 500 });
  }
}
