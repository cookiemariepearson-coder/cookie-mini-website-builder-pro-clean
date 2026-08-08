import { NextResponse } from 'next/server';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';
import { authorizeVideoResultAccess } from '../../../../lib/videoResultAccess';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function supabaseGet(path) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: [] };
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: supabaseHeaders(), cache: 'no-store' });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export async function GET(request) {
  const access = verifyVideoAccessToken(request.headers.get('x-video-access-token') || '');
  if (!access) return NextResponse.json({ ok: false, error: 'Unlock AI Video Studio to view saved video results.' }, { status: 401 });

  const url = new URL(request.url);
  let owner = null;
  if (access.kind === 'website-plan') {
    owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
  }
  const authorized = authorizeVideoResultAccess({
    access,
    owner,
    requestedEmail: url.searchParams.get('email') || '',
    requestedSlug: url.searchParams.get('slug') || '',
    requireIdentity: true
  });
  if (!authorized.ok) return NextResponse.json({ ok: false, error: 'No videos found for this verified access.' }, { status: authorized.status });

  const safeColumns = 'id,website_slug,business_name,status,video_type,platform,plan,video_url,thumbnail_url,duration,failure_code,failure_message,created_at,checked_at,updated_at';
  const path = `heygen_video_jobs?select=${safeColumns}&website_slug=eq.${encodeURIComponent(authorized.slug)}&order=created_at.desc&limit=30`;
  const result = await supabaseGet(path);

  if (result.missing) {
    console.error('[heygen-jobs] storage configuration missing');
    return NextResponse.json({ ok: false, error: 'Video results are temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  if (!result.ok) {
    console.error('[heygen-jobs] storage lookup failed', { status: result.status });
    return NextResponse.json({ ok: false, error: 'Video results could not be loaded. Please try again shortly.' }, { status: result.status || 500 });
  }

  const jobs = (Array.isArray(result.data) ? result.data : []).map(({ video_url, thumbnail_url, ...job }) => ({
    ...job,
    video_available: Boolean(video_url),
    thumbnail_available: Boolean(thumbnail_url)
  }));
  return NextResponse.json({ ok: true, jobs });
}
