import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/[<>]/g, '').trim().slice(0, 1200);
}

function buildHeyGenPrompt(input) {
  const biz = cleanText(input.businessName, 'the customer business');
  const promo = cleanText(input.promo, 'their product or service');
  const audience = cleanText(input.audience, 'local customers');
  const videoType = cleanText(input.videoType, 'Business Promo');
  const platform = cleanText(input.platform, 'TikTok / Reels');
  const style = cleanText(input.style, 'Professional');
  const length = cleanText(input.length, '15 seconds');
  const voice = cleanText(input.voice, 'Warm female voice');

  return [
    `Create a ${length} ${videoType} for ${biz}.`,
    `Main promotion: ${promo}.`,
    `Target audience: ${audience}.`,
    `Platform: ${platform}.`,
    `Visual style: ${style}.`,
    `Voice style: ${voice}.`,
    'Create a complete polished marketing video with a presenter or avatar, captions, smooth scene changes, clean branding, and a clear call to action.',
    'Use original generic visuals only. Do not use copyrighted logos, celebrity likenesses, or protected brand assets.',
    'End with a short call to action telling viewers to visit the website or contact the business.'
  ].join('\n');
}

export async function POST(request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'HEYGEN_API_KEY is missing in Vercel Environment Variables.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const requiredCode = process.env.HEYGEN_VIDEO_ACCESS_CODE || process.env.ADMIN_PIN || '';
    const providedCode = String(body.accessCode || '').trim();

    if (requiredCode && providedCode !== String(requiredCode).trim()) {
      return NextResponse.json({ ok: false, error: 'Invalid AI Video access code.' }, { status: 403 });
    }

    const prompt = buildHeyGenPrompt(body);

    const heygenResponse = await fetch('https://api.heygen.com/v3/video-agents', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    const responseText = await heygenResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!heygenResponse.ok) {
      return NextResponse.json({
        ok: false,
        error: data?.error?.message || data?.message || 'HeyGen video request failed.',
        detail: data
      }, { status: heygenResponse.status });
    }

    const payload = data?.data || data || {};
    const sessionId = payload.session_id || payload.sessionId || null;
    const videoId = payload.video_id || payload.videoId || null;

    return NextResponse.json({
      ok: true,
      status: payload.status || 'generating',
      sessionId,
      videoId,
      prompt,
      heygenSessionUrl: sessionId ? `https://app.heygen.com/video-agent/${sessionId}` : null,
      raw: data
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unexpected HeyGen create error.' }, { status: 500 });
  }
}
