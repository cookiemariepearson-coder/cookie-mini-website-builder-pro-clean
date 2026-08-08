import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';

export const dynamic = 'force-dynamic';

function clean(value = '') { return String(value || '').trim().toLowerCase(); }

async function verifyLicense(licenseKey) {
  const productId = process.env.GUMROAD_AI_VIDEO_PRODUCT_ID || 'GE_fDgvz_GT29Fn6eSj9uw==';
  const form = new URLSearchParams({ product_id: productId, license_key: licenseKey, increment_uses_count: 'false' });
  const response = await fetch('https://api.gumroad.com/v2/licenses/verify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  const data = await response.json().catch(() => ({}));
  const purchase = data.purchase || {};
  const blocked = purchase.refunded || purchase.chargebacked || purchase.disputed || purchase.subscription_ended_at || purchase.cancelled_at;
  return { valid: response.ok && data.success === true && !blocked, purchase };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const licenseKey = String(body.licenseKey || '').trim();
    const subject = licenseKey ? `license:${licenseKey.slice(-12)}` : `plan:${clean(body.email || body.slug)}`;
    const limited = rateLimit(request, { name: 'video-access', limit: 10, windowMs: 15 * 60 * 1000, subject });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before verifying access again.');
    if (licenseKey) {
      const result = await verifyLicense(licenseKey);
      if (!result.valid) return NextResponse.json({ ok: false, error: 'That license key could not be verified as an active AI Video Studio purchase.' }, { status: 403 });
      const purchaseEmail = clean(result.purchase.email || result.purchase.purchaser_email || '');
      return NextResponse.json({
        ok: true,
        token: createVideoAccessToken({ kind: 'standalone', saleId: result.purchase.sale_id || '', email: purchaseEmail }),
        access: 'Standalone AI Video Studio — 1 real video',
        email: purchaseEmail
      });
    }

    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    const slug = clean(body.slug).replace(/[^a-z0-9-]/g, '');
    const email = clean(body.email);
    if (!slug && !email) return NextResponse.json({ ok: false, error: 'Enter the website email or subdomain, or use a Gumroad license key.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    let query = supabase.from('websites').select('*').limit(1);
    query = slug ? query.eq('slug', slug) : query.eq('customer_email', email).order('updated_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const site = data?.[0];
    const active = site && clean(site.access_status) === 'active' && clean(site.subscription_status) === 'active';
    const eligible = site && ['business', 'premium'].includes(clean(site.plan));
    const emailMatches = !email || [site?.customer_email, site?.gumroad_email].map(clean).includes(email);
    if (!active || !eligible || !emailMatches || !siteBelongsToOwner(site, owner)) return NextResponse.json({ ok: false, error: 'No active Business or Premium website access was verified for this signed-in owner.' }, { status: 403 });
    return NextResponse.json({ ok: true, token: createVideoAccessToken({ kind: 'website-plan', slug: site.slug, plan: site.plan, ownerId: owner.user.id }), access: `${site.plan} website plan` });
  } catch (error) {
    console.error('[video-access] verification failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Video access could not be verified right now. Please try again shortly.' }, { status: 500 });
  }
}
