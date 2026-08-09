import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { APPROVED_AI_VIDEO_PRODUCT_ID, privateLicenseSubject, verifyAiVideoLicense } from '../../../../lib/gumroadVideoLicense.mjs';
import { standaloneVideoSlug, videoEmailHash } from '../../../../lib/videoResultAccess';
import { configuredVideoLimits, standaloneVideoEntitlement, websiteVideoEntitlement } from '../../../../lib/videoEntitlement.mjs';

export const dynamic = 'force-dynamic';

function clean(value = '') { return String(value || '').trim().toLowerCase(); }

export async function POST(request) {
  try {
    const body = await request.json();
    const licenseKey = String(body.licenseKey || '').trim();
    const subject = licenseKey ? privateLicenseSubject(licenseKey) : `plan:${clean(body.email || body.slug)}`;
    const limited = rateLimit(request, { name: 'video-access', limit: 10, windowMs: 15 * 60 * 1000, subject });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before verifying access again.');
    if (licenseKey) {
      const productId = process.env.GUMROAD_AI_VIDEO_PRODUCT_ID || APPROVED_AI_VIDEO_PRODUCT_ID;
      const result = await verifyAiVideoLicense({ licenseKey, productId });
      if (!result.valid) return NextResponse.json({ ok: false, error: 'That license key could not be verified as an active AI Video Studio purchase.' }, { status: 403 });
      const { saleId, email: purchaseEmail } = result.identity;
      const namespace = standaloneVideoSlug(saleId);
      const supabase = getSupabaseAdmin();
      const { count, error } = await supabase.from('heygen_video_jobs').select('id', { count: 'exact', head: true }).eq('website_slug', namespace);
      if (error) throw error;
      const entitlement = standaloneVideoEntitlement(count || 0);
      return NextResponse.json({
        ok: true,
        verified: true,
        ...entitlement,
        token: createVideoAccessToken({
          kind: 'standalone',
          namespace,
          emailHash: videoEmailHash(purchaseEmail)
        }),
        access: 'Standalone AI Video Studio — 1 real video',
        email: purchaseEmail,
        message: entitlement.generationAllowed
          ? 'Standalone AI Video Studio verified. One real-video credit is available.'
          : 'This verified standalone purchase has already used its included real-video credit. Open Video Results or purchase another approved standalone video.'
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
    const emailMatches = !email || [site?.customer_email, site?.gumroad_email].map(clean).includes(email);
    if (!site || !emailMatches || !siteBelongsToOwner(site, owner)) return NextResponse.json({ ok: false, error: 'No active Business or Premium website access was verified for this signed-in owner.' }, { status: 403 });
    const entitlement = websiteVideoEntitlement(site, { limits: configuredVideoLimits(process.env) });
    if (entitlement.state === 'invalid') return NextResponse.json({ ok: false, verified: true, ...entitlement, error: 'No active Business or Premium website access was verified for this signed-in owner.' }, { status: 403 });
    return NextResponse.json({
      ok: true,
      verified: true,
      ...entitlement,
      token: createVideoAccessToken({ kind: 'website-plan', slug: site.slug, plan: entitlement.plan, ownerId: owner.user.id }),
      access: `${entitlement.plan} website plan`,
      message: entitlement.generationAllowed
        ? `${entitlement.plan} website plan verified. ${entitlement.remaining} real-video credit${entitlement.remaining === 1 ? '' : 's'} available.`
        : `This verified ${entitlement.plan} website plan has no real-video credit remaining this month.`
    });
  } catch (error) {
    console.error('[video-access] verification failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Video access could not be verified right now. Please try again shortly.' }, { status: 500 });
  }
}
