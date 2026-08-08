import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

function clean(value = '') { return String(value || '').trim().toLowerCase(); }

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, verified: false, error: owner.error }, { status: owner.status });
    const body = await request.json();
    const slug = clean(body.slug);
    const email = owner.email;
    const expected = clean(body.plan);
    if (!slug && !email) return NextResponse.json({ ok: false, verified: false, error: 'Missing website or purchase email.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    let query = supabase.from('websites').select('*').limit(1);
    query = slug ? query.eq('slug', slug) : query.eq('customer_email', email).order('updated_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const website = data?.[0];
    if (!website) return NextResponse.json({ ok: true, verified: false, pending: true, error: 'The Gumroad purchase has not matched this website yet.' });
    if (!siteBelongsToOwner(website, owner)) {
      return NextResponse.json({ ok: false, verified: false, error: 'This website belongs to a different verified email.' }, { status: 403 });
    }

    const emailMatches = [website.customer_email, website.gumroad_email].map(clean).includes(email);
    const active = clean(website.subscription_status) === 'active' && clean(website.access_status) === 'active';
    const planMatches = expected === 'extra'
      ? clean(website.extra_page_subscription_status) === 'active'
      : clean(website.plan) === expected;
    const verified = emailMatches && active && planMatches;

    return NextResponse.json({
      ok: true,
      verified,
      pending: !verified,
      plan: website.plan,
      error: verified ? '' : 'Payment confirmation is still pending. Your draft remains saved; refresh this page after Gumroad finishes updating access.'
    });
  } catch (error) {
    console.error('[checkout-verify] verification failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, verified: false, error: 'Payment confirmation could not be checked right now. Your draft remains saved; please try again shortly.' }, { status: 500 });
  }
}
