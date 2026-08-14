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

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

function verifiedWebsiteResponse(site, entitlement, ownerId) {
  return privateResponse({
    ok: true,
    verified: true,
    ...entitlement,
    token: createVideoAccessToken({ kind: 'website-plan', slug: site.slug, plan: entitlement.plan, ownerId }),
    website: { slug: site.slug, businessName: site.business_name || site.slug },
    access: `${entitlement.plan} website plan`,
    message: entitlement.generationAllowed
      ? `${entitlement.plan} website plan verified. ${entitlement.remaining} real-video credit${entitlement.remaining === 1 ? '' : 's'} available.`
      : `This verified ${entitlement.plan} website plan has no real-video credit remaining this month.`
  });
}

async function eligibleOwnerWebsites(owner) {
  const found = new Map();
  async function addRows(query) {
    const { data, error } = await query;
    if (error) throw error;
    (data || []).forEach(row => found.set(row.slug, row));
  }

  await addRows(owner.supabase.from('websites').select('*').eq('owner_id', owner.user.id).order('updated_at', { ascending: false }).limit(50));
  await addRows(owner.supabase.from('websites').select('*').is('owner_id', null).eq('customer_email', owner.email).order('updated_at', { ascending: false }).limit(50));

  return Array.from(found.values()).map(site => ({
    site,
    entitlement: websiteVideoEntitlement(site, { limits: configuredVideoLimits(process.env) })
  })).filter(item => item.entitlement.state !== 'invalid');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const licenseKey = String(body.licenseKey || '').trim();
    if (licenseKey) {
      const limited = rateLimit(request, { name: 'video-access', limit: 10, windowMs: 15 * 60 * 1000, subject: privateLicenseSubject(licenseKey) });
      if (!limited.ok) return rateLimitResponse(limited, 'Please wait before verifying access again.');
      const productId = process.env.GUMROAD_AI_VIDEO_PRODUCT_ID || APPROVED_AI_VIDEO_PRODUCT_ID;
      const result = await verifyAiVideoLicense({ licenseKey, productId });
      if (!result.valid) return privateResponse({ ok: false, error: 'That purchase could not be verified. Check the license key from your Gumroad receipt.' }, 403);
      const { saleId, email: purchaseEmail } = result.identity;
      const namespace = standaloneVideoSlug(saleId);
      const supabase = getSupabaseAdmin();
      const { count, error } = await supabase.from('heygen_video_jobs').select('id', { count: 'exact', head: true }).eq('website_slug', namespace);
      if (error) throw error;
      const entitlement = standaloneVideoEntitlement(count || 0);
      return privateResponse({
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
          : 'Your 1 included video credit has been used. 0 video credits available. Open Video Results or purchase another approved standalone video.'
      });
    }

    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
    const limited = rateLimit(request, { name: 'video-access', limit: 10, windowMs: 15 * 60 * 1000, subject: `owner:${owner.user.id}` });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before verifying access again.');

    if (body.mode === 'account') {
      const eligible = await eligibleOwnerWebsites(owner);
      const requestedSlug = clean(body.slug).replace(/[^a-z0-9-]/g, '');
      if (!eligible.length) {
        return privateResponse({ ok: false, error: 'No eligible Business or Premium website was found for this account.' }, 403);
      }
      if (!requestedSlug && eligible.length > 1) {
        return privateResponse({
          ok: true,
          verified: false,
          selectionRequired: true,
          websites: eligible.map(({ site, entitlement }) => ({
            slug: site.slug,
            businessName: site.business_name || site.slug,
            plan: entitlement.plan,
            remaining: entitlement.remaining
          }))
        });
      }
      const selected = requestedSlug
        ? eligible.find(item => item.site.slug === requestedSlug)
        : eligible[0];
      if (!selected) return privateResponse({ ok: false, error: 'That website is not eligible for AI Video access.' }, 403);
      return verifiedWebsiteResponse(selected.site, selected.entitlement, owner.user.id);
    }

    const slug = clean(body.slug).replace(/[^a-z0-9-]/g, '');
    const email = clean(body.email);
    if (!slug && !email) return privateResponse({ ok: false, error: 'Choose account access or enter a Gumroad license key.' }, 400);
    const supabase = getSupabaseAdmin();
    let query = supabase.from('websites').select('*').limit(1);
    query = slug ? query.eq('slug', slug) : query.eq('customer_email', email).order('updated_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const site = data?.[0];
    const emailMatches = !email || [site?.customer_email, site?.gumroad_email].map(clean).includes(email);
    if (!site || !emailMatches || !siteBelongsToOwner(site, owner)) return privateResponse({ ok: false, error: 'No active Business or Premium website access was verified for this signed-in owner.' }, 403);
    const entitlement = websiteVideoEntitlement(site, { limits: configuredVideoLimits(process.env) });
    if (entitlement.state === 'invalid') return privateResponse({ ok: false, verified: true, ...entitlement, error: 'No active Business or Premium website access was verified for this signed-in owner.' }, 403);
    return verifiedWebsiteResponse(site, entitlement, owner.user.id);
  } catch (error) {
    console.error('[video-access] verification failed', { message: error?.message || String(error) });
    return privateResponse({ ok: false, error: 'Video access could not be verified right now. Please try again shortly.' }, 500);
  }
}
