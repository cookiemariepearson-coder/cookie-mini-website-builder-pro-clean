import { NextResponse } from 'next/server';
import { verifyVideoAccessToken } from '../../../lib/videoAccessToken';
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clean(value = '', max = 1800) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function extractText(data) {
  if (data?.output_text) return data.output_text;
  return (data?.output || [])
    .flatMap(item => item?.content || [])
    .filter(item => item?.type === 'output_text')
    .map(item => item.text || '')
    .join('\n');
}

function parseKit(raw = '') {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

function guidedFallbackKit({ businessName, promo, audience, platform, length, voice }) {
  const target = audience || 'customers who need this offer';
  const channel = platform || 'social media';
  const duration = length || 'a short video';
  const voiceStyle = voice || 'a warm, natural voice';
  return {
    'Script': `Open with ${businessName} in action. Introduce the offer: ${promo}. Show the customer benefit clearly, then invite ${target} to take the next step. End with the business name and a direct call to action.`,
    'Captions': `${businessName}\n${promo}\nMade for ${target}\nContact us to get started`,
    'Shot List': `1. Strong opening visual of the business or product.\n2. Close-up showing the main offer.\n3. Customer-focused benefit or result.\n4. Business name and call to action.`,
    'Video Prompt': `Create ${duration} ${channel} promotional video for ${businessName}. Feature ${promo}. Use polished, realistic visuals, warm lighting, smooth motion, readable scenes, and no invented prices or claims.`,
    'Voiceover': `${businessName} is ready to help. ${promo}. If this sounds like what you need, connect with us today and take the next step.`,
    'Next Steps': `1. Review and personalize the wording.\n2. Add real business photos, product images, or service clips.\n3. Record with ${voiceStyle}.\n4. Add short captions in your video editor.\n5. Publish on ${channel} with your real contact or order link.`
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const access = verifyVideoAccessToken(body.accessToken);
    if (!access) return NextResponse.json({ ok: false, error: 'Unlock AI Video Studio with an active website plan or Gumroad license key first.' }, { status: 403 });
    const limited = rateLimit(request, { name: 'video-kit', limit: 10, windowMs: 60 * 60 * 1000, subject: access.ownerId || access.saleId || '' });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before creating another AI video kit.');
    const businessName = clean(body.businessName, 160);
    const promo = clean(body.promo, 400);
    if (!businessName || !promo) {
      return NextResponse.json({ ok: false, error: 'Business name and promotion are required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        kit: guidedFallbackKit({ businessName, promo, audience: clean(body.audience), platform: clean(body.platform), length: clean(body.length), voice: clean(body.voice) }),
        fallback: true
      });
    }

    const prompt = `Create a complete, accurate marketing-video kit for this real small business.
Business: ${businessName}
Promotion: ${promo}
Audience: ${clean(body.audience)}
Video type: ${clean(body.videoType)}
Platform: ${clean(body.platform)}
Visual style: ${clean(body.style)}
Length: ${clean(body.length)}
Voice: ${clean(body.voice)}

Return only valid JSON with exactly these string keys:
"Script", "Captions", "Shot List", "Video Prompt", "Voiceover", "Next Steps".
Make the script fit the requested duration, keep every claim grounded in the information provided, do not invent prices or guarantees, include natural scene directions, useful captions, a clear call to action, and enough production detail for HeyGen or another video generator.`;

    const required = ['Script', 'Captions', 'Shot List', 'Video Prompt', 'Voiceover', 'Next Steps'];
    const configured = clean(process.env.OPENAI_VIDEO_MODEL || '', 100);
    const models = Array.from(new Set(['gpt-5.6-sol', configured.startsWith('gpt-5.6') ? configured : '', 'gpt-5.6-terra', 'gpt-4.1'].filter(Boolean)));

    for (const model of models) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: 'You are Cookie Digital Creations’ expert small-business video strategist. Return one complete JSON object and nothing else. Be specific, accurate, natural, and customer-friendly.' },
            { role: 'user', content: prompt }
          ],
          reasoning: model.startsWith('gpt-5.6') ? { effort: 'low' } : undefined,
          max_output_tokens: 2600
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('[video-kit] model request failed', { model, status: response.status, code: data?.error?.code || '', type: data?.error?.type || '' });
        continue;
      }
      const parsed = parseKit(extractText(data));
      if (!parsed) {
        console.error('[video-kit] model returned invalid JSON', { model });
        continue;
      }
      const kit = Object.fromEntries(required.map(key => [key, clean(parsed[key], 7000)]));
      if (required.every(key => kit[key])) return NextResponse.json({ ok: true, kit });
      console.error('[video-kit] model returned an incomplete kit', { model });
    }

    const kit = guidedFallbackKit({ businessName, promo, audience: clean(body.audience), platform: clean(body.platform), length: clean(body.length), voice: clean(body.voice) });
    return NextResponse.json({ ok: true, kit, fallback: true });
  } catch (error) {
    console.error('[video-kit] request failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Cookie AI could not finish a complete video kit. Please try again.' }, { status: 500 });
  }
}
