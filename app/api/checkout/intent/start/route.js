import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { normalizeWebsitePlan } from '../../../../../lib/websitePublishPolicy.mjs';
import {
  newWebsiteCheckoutIntent,
  checkoutIntentBelongsToOwner,
  checkoutIntentIdentityBelongsToOwner,
  normalizeCheckoutDraftSlug,
  normalizeWebsiteCheckoutIntentId,
  normalizeWebsiteCheckoutPlan,
  traceWebsiteCheckout,
  websiteCheckoutIntentState
} from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

const PAID_PLANS = new Set(['starter', 'business', 'premium']);

function authoritativeWebsitePlan(website = {}) {
  const storedPlan = normalizeWebsitePlan(website.plan);
  const savedPlan = normalizeWebsitePlan(website.site?.plan);
  return PAID_PLANS.has(storedPlan) ? storedPlan : PAID_PLANS.has(savedPlan) ? savedPlan : storedPlan || 'free';
}

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'website-checkout-intent-start', limit: 30, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a moment before starting another checkout.');
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    const requestedWebsiteId = String(body.websiteId || '').trim();
    if (requestedWebsiteId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedWebsiteId)) {
      return NextResponse.json({ ok: false, error: 'Invalid website reference.' }, { status: 400 });
    }
    let owner = null;
    let website = null;
    if (requestedWebsiteId) {
      owner = await getVerifiedSiteOwner(request);
      if (!owner.ok) return NextResponse.json({ ok: false, reasonCode: 'AUTH_REQUIRED', error: owner.error }, { status: owner.status });
      const { data: ownedWebsite, error: websiteError } = await supabase.from('websites').select('*').eq('id', requestedWebsiteId).maybeSingle();
      if (websiteError) throw websiteError;
      if (!ownedWebsite || !siteBelongsToOwner(ownedWebsite, owner)) {
        return NextResponse.json({ ok: false, error: 'This website belongs to a different verified customer.' }, { status: 403 });
      }
      website = ownedWebsite;
    }
    const existingIntentId = normalizeWebsiteCheckoutIntentId(body.intentId);
    if (existingIntentId) {
      const draftSlug = normalizeCheckoutDraftSlug(body.draftSlug);
      if (!draftSlug) return NextResponse.json({ ok: false, error: 'Add a website name before continuing to checkout.' }, { status: 400 });
      const { data: existing, error: lookupError } = await supabase.from('website_checkout_intents').select('*').eq('id', existingIntentId).maybeSingle();
      if (lookupError) throw lookupError;
      const state = websiteCheckoutIntentState(existing || {});
      const requestedPlan = normalizeWebsiteCheckoutPlan(body.plan);
      const storedPlan = normalizeWebsiteCheckoutPlan(existing?.plan);
      const storedDraftSlug = normalizeCheckoutDraftSlug(existing?.draft_slug);
      const identityBound = Boolean(existing?.owner_id || existing?.email_hash);
      if (!existing || !storedPlan) return NextResponse.json({ ok: false, error: 'This checkout continuation is no longer available. Return to Pricing to start again.' }, { status: 410 });
      const websitePlan = website ? authoritativeWebsitePlan(website) : '';
      const maySupersede = Boolean(owner?.ok && website && requestedPlan && requestedPlan === websitePlan);
      if (website && ((requestedPlan && requestedPlan !== storedPlan) || !state.ok)) {
        if (!maySupersede) {
          if (requestedPlan && requestedPlan !== storedPlan) return NextResponse.json({ ok: false, error: 'The selected plan does not match this secure checkout.' }, { status: 409 });
          return NextResponse.json({ ok: false, error: state.reason === 'used' ? 'This checkout was already opened and cannot be replayed.' : 'This checkout continuation is no longer available.' }, { status: state.reason === 'used' ? 409 : 410 });
        }
        const replacement = newWebsiteCheckoutIntent({ plan: requestedPlan, draftSlug: website.slug, email: owner.email, ownerId: owner.user.id, websiteId: website.id });
        const { error: replacementError } = await supabase.from('website_checkout_intents').insert(replacement);
        if (replacementError) throw replacementError;
        traceWebsiteCheckout('INTENT_SUPERSEDED_FOR_WEBSITE_PLAN', replacement, {
          websiteId: website.id,
          ownerId: owner.user.id,
          storedPlan: normalizeWebsitePlan(website.plan),
          builderPlan: normalizeWebsitePlan(website.site?.plan),
          browserPlan: requestedPlan,
          intentPlan: storedPlan,
          product: requestedPlan,
          reasonCode: requestedPlan !== storedPlan ? 'STALE_CROSS_PLAN_INTENT' : String(state.reason || 'ABANDONED').toUpperCase()
        });
        return NextResponse.json({ ok: true, intentId: replacement.id, plan: replacement.plan, draftSlug: replacement.draft_slug, expiresAt: replacement.expires_at, replaced: true });
      }
      if (requestedPlan && requestedPlan !== storedPlan) return NextResponse.json({ ok: false, error: 'The selected plan does not match this secure checkout.' }, { status: 409 });
      if (identityBound && storedDraftSlug && storedDraftSlug !== draftSlug) return NextResponse.json({ ok: false, error: 'This checkout is attached to a different website draft.' }, { status: 409 });

      if (!state.ok) {
        if (state.reason !== 'expired') return NextResponse.json({ ok: false, error: state.reason === 'used' ? 'This checkout was already opened and cannot be replayed.' : 'This checkout continuation is no longer available.' }, { status: state.reason === 'used' ? 409 : 410 });
        const owner = await getVerifiedSiteOwner(request);
        if (!owner.ok) return NextResponse.json({ ok: false, reasonCode: 'AUTH_REQUIRED', error: 'This checkout expired. Verify your email to securely start a replacement checkout.' }, { status: owner.status });
        if (identityBound && !checkoutIntentIdentityBelongsToOwner(existing, owner)) {
          return NextResponse.json({ ok: false, error: 'This checkout belongs to a different verified customer.' }, { status: 403 });
        }
        const replacementDraftSlug = identityBound ? storedDraftSlug : draftSlug;
        if (replacementDraftSlug) {
          const { data: website, error: websiteError } = await supabase.from('websites').select('id,owner_id,customer_email').eq('slug', replacementDraftSlug).maybeSingle();
          if (websiteError) throw websiteError;
          if (website && !siteBelongsToOwner(website, owner)) return NextResponse.json({ ok: false, error: 'This website belongs to a different verified customer.' }, { status: 403 });
        }
        const replacement = newWebsiteCheckoutIntent({ plan: storedPlan, draftSlug: replacementDraftSlug, email: owner.email, ownerId: owner.user.id });
        const { error: replacementError } = await supabase.from('website_checkout_intents').insert(replacement);
        if (replacementError) throw replacementError;
        traceWebsiteCheckout('INTENT_REPLACED_AFTER_EXPIRY', replacement, { reasonCode: 'EXPIRED' });
        return NextResponse.json({ ok: true, intentId: replacement.id, plan: replacement.plan, draftSlug: replacement.draft_slug, expiresAt: replacement.expires_at, replaced: true });
      }

      if (state.ownerId || state.emailHash) {
        const owner = await getVerifiedSiteOwner(request);
        if (!owner.ok) return NextResponse.json({ ok: false, reasonCode: 'AUTH_REQUIRED', error: owner.error }, { status: owner.status });
        if (!checkoutIntentBelongsToOwner(existing, owner)) return NextResponse.json({ ok: false, error: 'This checkout belongs to a different verified customer.' }, { status: 403 });
        if (state.draftSlug) {
          const { data: website, error: websiteError } = await supabase.from('websites').select('id,owner_id,customer_email').eq('slug', state.draftSlug).maybeSingle();
          if (websiteError) throw websiteError;
          if (website && !siteBelongsToOwner(website, owner)) return NextResponse.json({ ok: false, error: 'This website belongs to a different verified customer.' }, { status: 403 });
        }
        traceWebsiteCheckout('VERIFIED_INTENT_REUSED', existing);
        return NextResponse.json({ ok: true, intentId: state.id, plan: state.plan, draftSlug: state.draftSlug, expiresAt: existing.expires_at, resumed: true });
      }

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
      traceWebsiteCheckout('INTENT_PREPARED_FOR_AUTH', { ...existing, ...prepared });
      return NextResponse.json({ ok: true, intentId: prepared.id, plan: prepared.plan, draftSlug: prepared.draft_slug, expiresAt: prepared.expires_at });
    }
    const requestedPlan = normalizeWebsiteCheckoutPlan(body.plan);
    if (website && requestedPlan !== authoritativeWebsitePlan(website)) {
      return NextResponse.json({ ok: false, error: 'The selected plan does not match this saved website.' }, { status: 409 });
    }
    const intent = newWebsiteCheckoutIntent({
      plan: body.plan,
      draftSlug: website?.slug || body.draftSlug,
      email: owner?.ok ? owner.email : '',
      ownerId: owner?.ok ? owner.user.id : '',
      websiteId: website?.id || ''
    });
    if (!intent) return NextResponse.json({ ok: false, error: 'Choose Starter Pro, Business, Premium, or the Extra Page Add-On.' }, { status: 400 });

    const { error } = await supabase.from('website_checkout_intents').insert(intent);
    if (error) throw error;
    traceWebsiteCheckout('INTENT_CREATED', intent);
    return NextResponse.json({ ok: true, intentId: intent.id, plan: intent.plan, expiresAt: intent.expires_at });
  } catch (error) {
    console.error('[website-checkout-intent] start failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The secure checkout could not start. Your draft is still safe. Please try again shortly.' }, { status: 500 });
  }
}
