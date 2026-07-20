import { NextResponse } from 'next/server';

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
      return NextResponse.json({ ok: false, error: 'HEYGEN_API_KEY is missing in Vercel Environment Variables.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    let sessionId = String(body.sessionId || '').trim();
    let videoId = String(body.videoId || '').trim();
    const jobId = String(body.jobId || '').trim();
    let sessionData = null;

    if (sessionId && !videoId) {
      const sessionResponse = await fetch(`https://api.heygen.com/v3/video-agents/${encodeURIComponent(sessionId)}`, {
        headers: { 'X-Api-Key': apiKey }
      });
      const sessionJson = await readJson(sessionResponse);
      if (!sessionResponse.ok) {
        return NextResponse.json({ ok: false, error: sessionJson?.error?.message || 'Could not check HeyGen session.', detail: sessionJson }, { status: sessionResponse.status });
      }
      sessionData = sessionJson?.data || sessionJson || {};
      videoId = sessionData.video_id || sessionData.videoId || videoId;
    }

    if (!videoId) {
      return NextResponse.json({ ok: true, status: sessionData?.status || 'generating', sessionId, videoId: null, videoUrl: null, message: 'Video is still generating. Check again soon.', session: sessionData });
    }

    const videoResponse = await fetch(`https://api.heygen.com/v3/videos/${encodeURIComponent(videoId)}`, {
      headers: { 'X-Api-Key': apiKey }
    });
    const videoJson = await readJson(videoResponse);

    if (!videoResponse.ok) {
      return NextResponse.json({ ok: false, error: videoJson?.error?.message || 'Could not check HeyGen video.', detail: videoJson }, { status: videoResponse.status });
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
      thumbnailUrl: video.thumbnail_url || video.thumbnailUrl || null,
      duration: video.duration || null,
      failureCode: video.failure_code || video.failureCode || null,
      failureMessage: video.failure_message || video.failureMessage || null,
      session: sessionData,
      raw: videoJson
    };
    await updateStoredJob({ jobId, sessionId, videoId, result });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unexpected HeyGen status error.' }, { status: 500 });
  }
}
