import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { APPROVED_WEBSITE_PRODUCTS } from '../../../../lib/gumroadWebsiteProducts.mjs';
import { extraPageAccess, websitePlanAccess } from '../../../../lib/subscriptionLifecycle.mjs';

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
    const slug = clean(body.slug);
    const email = owner.email;
    const expected = clean(body.plan);
    if (!slug && !email) return privateResponse({ ok: false, verified: false, error: 'Missing website or purchase email.' }, 400);

    const supabase = getSupabaseAdmin();
    let query = supabase.from('websites').select('*').limit(1);
    query = slug ? query.eq('slug', slug) : query.eq('customer_email', email).order('updated_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const website = data?.[0];
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
      error: verified ? '' : 'Payment confirmation is still pending. Your draft remains saved; refresh this page after Gumroad finishes updating access.'
    });
  } catch (error) {
    console.error('[checkout-verify] verification failed', { message: error?.message || String(error) });
    return privateResponse({ ok: false, verified: false, error: 'Payment confirmation could not be checked right now. Your draft remains saved; please try again shortly.' }, 500);
  }
}
