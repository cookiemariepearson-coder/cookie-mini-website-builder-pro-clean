import { NextResponse } from 'next/server';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';
import { authorizeVideoResultAccess, videoJobBelongsToAccess } from '../../../../lib/videoResultAccess';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateJson(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  return NextResponse.json(body, { ...init, headers });
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function storedJob(jobId) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { missing: true };
  const path = `heygen_video_jobs?id=eq.${encodeURIComponent(jobId)}&select=id,website_slug,video_url,thumbnail_url&limit=1`;
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: supabaseHeaders(), cache: 'no-store' });
  const data = await response.json().catch(() => []);
  return { ok: response.ok, status: response.status, job: Array.isArray(data) ? data[0] : null };
}

export async function GET(request) {
  try {
    const access = verifyVideoAccessToken(request.headers.get('x-video-access-token') || '');
    if (!access) return privateJson({ ok: false, error: 'Verified video access is required.' }, { status: 401 });

    let owner = null;
    if (access.kind === 'website-plan') {
      owner = await getVerifiedSiteOwner(request);
      if (!owner.ok) return privateJson({ ok: false, error: owner.error }, { status: owner.status });
    }
    const authorized = authorizeVideoResultAccess({ access, owner });
    if (!authorized.ok) return privateJson({ ok: false, error: 'This video does not belong to your verified access.' }, { status: authorized.status });

    const url = new URL(request.url);
    const jobId = String(url.searchParams.get('jobId') || '').trim();
    const kind = url.searchParams.get('kind') === 'thumbnail' ? 'thumbnail' : 'video';
    if (!/^[a-zA-Z0-9-]{8,100}$/.test(jobId)) return privateJson({ ok: false, error: 'Saved video was not found.' }, { status: 404 });

    const stored = await storedJob(jobId);
    if (stored.missing || !stored.ok) {
      console.error('[heygen-media] storage lookup failed', { status: stored.status || 503 });
      return privateJson({ ok: false, error: 'Video media is temporarily unavailable.' }, { status: 503 });
    }
    if (!stored.job) return privateJson({ ok: false, error: 'Saved video was not found.' }, { status: 404 });
    if (!videoJobBelongsToAccess(stored.job.website_slug, authorized.slug)) return privateJson({ ok: false, error: 'This video does not belong to your verified access.' }, { status: 403 });

    const rawUrl = kind === 'thumbnail' ? stored.job.thumbnail_url : stored.job.video_url;
    let providerUrl;
    try { providerUrl = new URL(rawUrl); } catch { providerUrl = null; }
    if (!providerUrl || providerUrl.protocol !== 'https:') return privateJson({ ok: false, error: 'This video is not ready yet.' }, { status: 404 });

    const upstream = await fetch(providerUrl, { cache: 'no-store' });
    if (!upstream.ok || !upstream.body) {
      console.error('[heygen-media] provider media unavailable', { status: upstream.status, kind });
      return privateJson({ ok: false, error: 'Video media could not be loaded. Refresh the status and try again.' }, { status: 502 });
    }
    const headers = new Headers({
      'Content-Type': upstream.headers.get('content-type') || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': `${kind === 'video' ? 'attachment' : 'inline'}; filename="cookie-video-${jobId}.${kind === 'video' ? 'mp4' : 'jpg'}"`,
      'X-Content-Type-Options': 'nosniff'
    });
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('[heygen-media] request failed', { message: error?.message || String(error) });
    return privateJson({ ok: false, error: 'Video media could not be loaded.' }, { status: 500 });
  }
}
