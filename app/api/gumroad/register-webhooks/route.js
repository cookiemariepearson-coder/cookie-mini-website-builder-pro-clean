import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RESOURCES = ['sale','refund','cancellation','subscription_ended','subscription_restarted','subscription_updated','dispute','dispute_won'];

function baseUrl(req) {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
  if (root) return `https://www.${root}`;
  return new URL(req.url).origin;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = String(body.pin || '');
    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ ok:false, error:'Invalid admin PIN.' }, { status:401 });
    }
    const token = process.env.GUMROAD_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ ok:false, error:'Missing GUMROAD_ACCESS_TOKEN in Vercel.' }, { status:400 });
    }

    const results = [];
    for (const resource of RESOURCES) {
      const form = new URLSearchParams();
      form.set('resource_name', resource);
      form.set('post_url', `${baseUrl(req)}/api/gumroad/webhook?resource=${resource}`);
      const response = await fetch('https://api.gumroad.com/v2/resource_subscriptions', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
      const data = await response.json().catch(() => ({ success:false, error:'Could not parse Gumroad response.' }));
      results.push({ resource, status: response.status, data });
    }
    return NextResponse.json({ ok:true, results });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  }
}
