import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { configuredVideoLimits, standaloneVideoEntitlement, websiteVideoEntitlement } from '../../../../lib/videoEntitlement.mjs';
import { standaloneVideoSlugFromAccess } from '../../../../lib/videoResultAccess';
import { summarizeVideoJobs } from '../../../../lib/videoJourney.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateTokenSubject(token = '') {
  return `pass:${crypto.createHash('sha256').update(String(token || '')).digest('hex').slice(0, 24)}`;
}

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

async function jobSummary(supabase, websiteSlug) {
  const { data, error } = await supabase
    .from('heygen_video_jobs')
    .select('id,business_name,status,video_url,created_at')
    .eq('website_slug', websiteSlug)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return summarizeVideoJobs(data || []);
}

function entitlementResponse(entitlement, access, jobs) {
  const noCredit = entitlement.remaining <= 0;
  const standaloneNoCredit = noCredit && entitlement.kind === 'standalone';
  return privateResponse({
    ok: true,
    verified: true,
    ...entitlement,
    ...jobs,
    access,
    message: noCredit
      ? standaloneNoCredit
        ? 'Your 1 included video credit has been used. 0 video credits available. You can open Video Results or purchase another approved standalone video.'
        : '0 video credits available for this verified website plan. You can open Video Results to view completed videos.'
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
      return privateResponse({ ok: false, verified: false, state: 'planning', generationAllowed: false, error: 'Unlock AI Video access to continue.' }, 401);
    }

    const supabase = getSupabaseAdmin();
    if (access.kind === 'standalone') {
      const namespace = standaloneVideoSlugFromAccess(access);
      if (!namespace) return NextResponse.json({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'This saved video access is not valid. Verify the Gumroad license again.' }, { status: 403 });
      const { count, error } = await supabase.from('heygen_video_jobs').select('id', { count: 'exact', head: true }).eq('website_slug', namespace);
      if (error) throw error;
      return entitlementResponse(standaloneVideoEntitlement(count || 0), 'Standalone AI Video Studio', await jobSummary(supabase, namespace));
    }

    if (access.kind === 'website-plan' && access.slug && access.ownerId) {
      const owner = await getVerifiedSiteOwner(request);
      if (!owner.ok || String(owner.user?.id || '') !== String(access.ownerId)) {
        return privateResponse({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'Securely sign in to continue with this website.' }, 403);
      }
      const { data: website, error } = await supabase.from('websites').select('*').eq('slug', access.slug).maybeSingle();
      if (error) throw error;
      if (!website || !siteBelongsToOwner(website, owner)) {
        return privateResponse({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'This video access does not belong to the signed-in website owner.' }, 403);
      }
      const entitlement = websiteVideoEntitlement(website, { limits: configuredVideoLimits(process.env) });
      if (entitlement.state === 'invalid') {
        return privateResponse({ ok: false, verified: true, ...entitlement, error: 'This website plan is not active and eligible for real-video generation.' }, 403);
      }
      return entitlementResponse(entitlement, `${entitlement.plan} website plan`, await jobSummary(supabase, access.slug));
    }

    return privateResponse({ ok: false, verified: false, state: 'invalid', generationAllowed: false, error: 'This saved video access is not valid. Unlock access again.' }, 403);
  } catch (error) {
    console.error('[video-access-status] verification failed', { message: error?.message || String(error) });
    return privateResponse({ ok: false, verified: false, state: 'error', generationAllowed: false, error: 'Video access could not be checked right now. Your saved plan is still available.' }, 500);
  }
}
