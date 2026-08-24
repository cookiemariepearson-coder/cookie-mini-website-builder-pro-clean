import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { APPROVED_WEBSITE_PRODUCTS } from '../../../../lib/gumroadWebsiteProducts.mjs';
import { extraPageAccess, websitePlanAccess } from '../../../../lib/subscriptionLifecycle.mjs';
import { checkoutIntentIdentityBelongsToOwner, normalizeWebsiteCheckoutIntentId } from '../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

function clean(value = '') { return String(value || '').trim().toLowerCase(); }

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return privateResponse({ ok: false, verified: false, error: owner.error }, owner.status);
    const body = await request.json();
    const email = owner.email;
    const expected = clean(body.plan);
    const cookieStore = await cookies();
    const intentId = normalizeWebsiteCheckoutIntentId(cookieStore.get('cookieWebsiteCheckoutReturn')?.value || '');
    if (!intentId) return privateResponse({ ok: false, verified: false, error: 'This purchase return is missing its secure website reference. Open the saved website from My Websites.' }, 409);

    const supabase = getSupabaseAdmin();
    const { data: intent, error: intentError } = await supabase.from('website_checkout_intents').select('*').eq('id', intentId).maybeSingle();
    if (intentError) throw intentError;
    if (!intent || intent.status !== 'checkout_started' || !intent.website_id || !checkoutIntentIdentityBelongsToOwner(intent, owner)) {
      return privateResponse({ ok: false, verified: false, error: 'This purchase return does not match the signed-in customer and website.' }, 403);
    }
    if (expected && expected !== clean(intent.plan)) return privateResponse({ ok: false, verified: false, error: 'This purchase return does not match the selected website plan.' }, 409);
    const { data: website, error } = await supabase.from('websites').select('*').eq('id', intent.website_id).maybeSingle();
    if (error) throw error;
    if (!website) return privateResponse({ ok: true, verified: false, pending: true, error: 'The Gumroad purchase has not matched this website yet.' });
    if (!siteBelongsToOwner(website, owner)) {
      return privateResponse({ ok: false, verified: false, error: 'This website belongs to a different verified email.' }, 403);
    }

    const emailMatches = [website.customer_email, website.gumroad_email].map(clean).includes(email);
    const active = websitePlanAccess(website).active;
    const expectedProduct = APPROVED_WEBSITE_PRODUCTS[expected];
    const planMatches = expected === 'extra'
      ? extraPageAccess(website).active
      : clean(website.plan) === expected;
    const productMatches = expected === 'extra'
      ? Boolean(APPROVED_WEBSITE_PRODUCTS.extra.productId && clean(website.extra_page_gumroad_product_id) === clean(APPROVED_WEBSITE_PRODUCTS.extra.productId))
      : Boolean(expectedProduct?.productId && clean(website.gumroad_product_id) === clean(expectedProduct.productId));
    const verified = emailMatches && active && planMatches && productMatches;

    return privateResponse({
      ok: true,
      verified,
      pending: !verified,
      plan: website.plan,
      websiteId: website.id,
      checkoutIntentId: intent.id,
      returnPath: `/builder?website=${encodeURIComponent(website.id)}`,
      site: verified ? { ...website.site, websiteId: website.id, draftId: website.id, slug: website.slug, plan: website.plan, status: website.status } : null,
      error: verified ? '' : 'Payment confirmation is still pending. Your draft remains saved; refresh this page after Gumroad finishes updating access.'
    });
  } catch (error) {
    console.error('[checkout-verify] verification failed', { message: error?.message || String(error) });
    return privateResponse({ ok: false, verified: false, error: 'Payment confirmation could not be checked right now. Your draft remains saved; please try again shortly.' }, 500);
  }
}
