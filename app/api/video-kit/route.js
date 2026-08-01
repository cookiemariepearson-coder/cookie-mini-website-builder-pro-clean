import { NextResponse } from 'next/server';

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

export async function POST(request) {
  try {
    const body = await request.json();
    const businessName = clean(body.businessName, 160);
    const promo = clean(body.promo, 400);
    if (!businessName || !promo) {
      return NextResponse.json({ ok: false, error: 'Business name and promotion are required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Cookie AI is not connected. Check the OpenAI key in Vercel.' }, { status: 503 });
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

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_VIDEO_MODEL || process.env.OPENAI_MODEL || 'gpt-5.1',
        input: [
          { role: 'system', content: 'You are Cookie Digital Creations’ expert small-business video strategist. Be complete, specific, accurate, and customer-friendly.' },
          { role: 'user', content: prompt }
        ],
        text: { format: { type: 'json_object' } },
        max_output_tokens: 1800
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: 'Cookie AI could not create the custom video kit right now.' }, { status: 502 });
    }
    const parsed = JSON.parse(extractText(data));
    const required = ['Script', 'Captions', 'Shot List', 'Video Prompt', 'Voiceover', 'Next Steps'];
    const kit = Object.fromEntries(required.map(key => [key, clean(parsed[key], 7000)]));
    if (required.some(key => !kit[key])) throw new Error('Incomplete kit');
    return NextResponse.json({ ok: true, kit });
  } catch {
    return NextResponse.json({ ok: false, error: 'Cookie AI could not finish a complete video kit. Please try again.' }, { status: 500 });
  }
}
