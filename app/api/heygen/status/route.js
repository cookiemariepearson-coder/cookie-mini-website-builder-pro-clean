import { NextResponse } from 'next/server';
import { verifyVideoAccessToken } from '../../../../lib/videoAccessToken';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';
import { authorizeVideoResultAccess, videoJobBelongsToAccess } from '../../../../lib/videoResultAccess';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
}

async function supabasePatch(path, update) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: null };
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify(update)
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function supabaseGet(path) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, missing: true, data: null };
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: supabaseHeaders(), cache: 'no-store' });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function updateStoredJob({ jobId, sessionId, videoId, result }) {
  const patch = {
    status: result.videoUrl ? 'completed' : (result.status || 'processing'),
    heygen_session_id: sessionId || null,
    heygen_video_id: result.videoId || videoId || null,
    ...(result.videoUrl ? { video_url: result.videoUrl } : {}),
    ...(result.thumbnailUrl ? { thumbnail_url: result.thumbnailUrl } : {}),
    duration: result.duration || null,
    failure_code: result.failureCode || null,
    failure_message: result.failureMessage || null,
    checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raw_response: result.raw || null
  };
  try {
    if (jobId) return await supabasePatch(`heygen_video_jobs?id=eq.${encodeURIComponent(jobId)}`, patch);
    if (videoId) return await supabasePatch(`heygen_video_jobs?heygen_video_id=eq.${encodeURIComponent(videoId)}`, patch);
    if (sessionId) return await supabasePatch(`heygen_video_jobs?heygen_session_id=eq.${encodeURIComponent(sessionId)}`, patch);
  } catch {}
  return { ok: false };
}

export async function POST(request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      console.error('[heygen-status] provider configuration missing');
      return NextResponse.json({ ok: false, error: 'Video results are temporarily unavailable. Please contact hello@cookiesdigitalcreations.com.' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    let sessionId = '';
    let videoId = '';
    const jobId = String(body.jobId || '').trim();
    const access = verifyVideoAccessToken(request.headers.get('x-video-access-token') || '');
    if (!access || !jobId) return NextResponse.json({ ok: false, error: 'Unlock AI Video Studio to refresh a saved video.' }, { status: 401 });
    let owner = null;
    if (access.kind === 'website-plan') {
      owner = await getVerifiedSiteOwner(request);
      if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    }
    const authorized = authorizeVideoResultAccess({ access, owner });
    if (!authorized.ok) return NextResponse.json({ ok: false, error: 'This video access pass is no longer valid. Verify access again.' }, { status: authorized.status });
    const allowedSlug = authorized.slug;
    const stored = await supabaseGet(`heygen_video_jobs?id=eq.${encodeURIComponent(jobId)}&select=id,website_slug,heygen_session_id,heygen_video_id&limit=1`);
    if (!stored.ok || !Array.isArray(stored.data) || !stored.data[0]) return NextResponse.json({ ok: false, error: 'Saved video was not found.' }, { status: 404 });
    if (!videoJobBelongsToAccess(stored.data[0].website_slug, allowedSlug)) return NextResponse.json({ ok: false, error: 'This saved video does not belong to your access pass.' }, { status: 403 });
    sessionId = String(stored.data[0].heygen_session_id || '').trim();
    videoId = String(stored.data[0].heygen_video_id || '').trim();
    let sessionData = null;

    if (sessionId && !videoId) {
      const sessionResponse = await fetch(`https://api.heygen.com/v3/video-agents/${encodeURIComponent(sessionId)}`, {
        headers: { 'X-Api-Key': apiKey }
      });
      const sessionJson = await readJson(sessionResponse);
      if (!sessionResponse.ok) {
        console.error('[heygen-status] session lookup failed', { status: sessionResponse.status, code: sessionJson?.error?.code || '' });
        return NextResponse.json({ ok: false, error: 'The video provider could not check this video yet. Please try again shortly.' }, { status: sessionResponse.status });
      }
      sessionData = sessionJson?.data || sessionJson || {};
      videoId = sessionData.video_id || sessionData.videoId || videoId;
    }

    if (!videoId) {
      return NextResponse.json({ ok: true, status: sessionData?.status || 'generating', videoAvailable: false, message: 'Video is still generating. Check again soon.' });
    }

    const videoResponse = await fetch(`https://api.heygen.com/v3/videos/${encodeURIComponent(videoId)}`, {
      headers: { 'X-Api-Key': apiKey }
    });
    const videoJson = await readJson(videoResponse);

    if (!videoResponse.ok) {
      console.error('[heygen-status] video lookup failed', { status: videoResponse.status, code: videoJson?.error?.code || '' });
      return NextResponse.json({ ok: false, error: 'The video provider could not check this video yet. Please try again shortly.' }, { status: videoResponse.status });
    }

    const video = videoJson?.data || videoJson || {};
    const readyUrl = video.video_url || video.videoUrl || video.url || null;
    const result = {
      ok: true,
      status: readyUrl ? 'completed' : (video.status || sessionData?.status || 'processing'),
      sessionId,
      jobId: jobId || null,
      videoId: video.id || videoId,
      videoUrl: readyUrl,
      videoAvailable: Boolean(readyUrl),
      thumbnailUrl: video.thumbnail_url || video.thumbnailUrl || null,
      duration: video.duration || null,
      failureCode: video.failure_code || video.failureCode || null,
      failureMessage: video.failure_message || video.failureMessage ? 'The video provider could not complete this video. Please contact support if retrying does not help.' : null
    };
    await updateStoredJob({ jobId, sessionId, videoId, result });
    const { videoUrl: _videoUrl, sessionId: _sessionId, videoId: _videoId, thumbnailUrl: _thumbnailUrl, ...safeResult } = result;
    return NextResponse.json({ ...safeResult, thumbnailAvailable: Boolean(result.thumbnailUrl) });
  } catch (error) {
    console.error('[heygen-status] request failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Video results could not be refreshed. Please try again shortly.' }, { status: 500 });
  }
}
