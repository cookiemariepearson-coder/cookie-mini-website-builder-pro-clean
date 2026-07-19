import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
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
    return NextResponse.json({
      ok: true,
      status: video.status || sessionData?.status || 'processing',
      sessionId,
      videoId: video.id || videoId,
      videoUrl: video.video_url || video.videoUrl || video.url || null,
      thumbnailUrl: video.thumbnail_url || video.thumbnailUrl || null,
      duration: video.duration || null,
      failureCode: video.failure_code || video.failureCode || null,
      failureMessage: video.failure_message || video.failureMessage || null,
      session: sessionData,
      raw: videoJson
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unexpected HeyGen status error.' }, { status: 500 });
  }
}
