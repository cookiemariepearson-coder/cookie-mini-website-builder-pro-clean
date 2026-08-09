import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { configuredVideoLimits, standaloneVideoEntitlement, websiteVideoEntitlement } from '../../../../lib/videoEntitlement.mjs';
import { standaloneVideoSlugFromAccess } from '../../../../lib/videoResultAccess';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateTokenSubject(token = '') {
  return `pass:${crypto.createHash('sha256').update(String(token || '')).digest('hex').slice(0, 24)}`;
}

function entitlementResponse(entitlement, access) {
  const noCredit = entitlement.remaining <= 0;
  return NextResponse.json({
    ok: true,
    verified: true,
    ...entitlement,
    access,
    message: noCredit
      ? 'This verified access has no real-video credit remaining. You can open Video Results or purchase another approved standalone video.'
      : `${access} verified. ${entitlement.remaining} real-video credit${entitlement.remaining === 1 ? '' : 's'} available.`
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessToken = String(body.accessToken || '').trim();
    const limited = rateLimit(request, { name: 'video-access-status', limit: 30, windowMs: 15 * 60 * 1000, subject: privateTokenSubject(accessToken) });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before checking video access again.');

    const access = verifyVideoAccessToken(accessToken);
    if (!access) {
      return NextResponse.json({ ok: false, verified: false, state: 'planning', generationAllowed: false, error: 'Purchase or verify access before generating a real video.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (access.kind === 'standalone') {
      const namespace = standaloneVideoSlugFromAccess(access);
      if (!namespace) return NextResponse.json({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'This saved video access is not valid. Verify the Gumroad license again.' }, { status: 403 });
      const { count, error } = await supabase.from('heygen_video_jobs').select('id', { count: 'exact', head: true }).eq('website_slug', namespace);
      if (error) throw error;
      return entitlementResponse(standaloneVideoEntitlement(count || 0), 'Standalone AI Video Studio');
    }

    if (access.kind === 'website-plan' && access.slug && access.ownerId) {
      const owner = await getVerifiedSiteOwner(request);
      if (!owner.ok || String(owner.user?.id || '') !== String(access.ownerId)) {
        return NextResponse.json({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'Securely sign in and verify the eligible website plan again.' }, { status: 403 });
      }
      const { data: website, error } = await supabase.from('websites').select('*').eq('slug', access.slug).maybeSingle();
      if (error) throw error;
      if (!website || !siteBelongsToOwner(website, owner)) {
        return NextResponse.json({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'This video access does not belong to the signed-in website owner.' }, { status: 403 });
      }
      const entitlement = websiteVideoEntitlement(website, { limits: configuredVideoLimits(process.env) });
      if (entitlement.state === 'invalid') {
        return NextResponse.json({ ok: false, verified: true, ...entitlement, error: 'This website plan is not active and eligible for real-video generation.' }, { status: 403 });
      }
      return entitlementResponse(entitlement, `${entitlement.plan} website plan`);
    }

    return NextResponse.json({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'This saved video access is not valid. Verify access again.' }, { status: 403 });
  } catch (error) {
    console.error('[video-access-status] verification failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, verified: false, state: 'error', generationAllowed: false, error: 'Video access could not be checked right now. Your saved plan is still available.' }, { status: 500 });
  }
}
