import { NextResponse } from 'next/server';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

const RESOURCES = ['sale','refund','cancellation','subscription_ended','subscription_restarted','subscription_updated','dispute','dispute_won'];

function baseUrl(req) {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
  if (root) return `https://www.${root}`;
  return new URL(req.url).origin;
}

export async function POST(req) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin.ok) return NextResponse.json({ ok:false, error:admin.error }, { status:admin.status });
    const token = process.env.GUMROAD_ACCESS_TOKEN;
    if (!token) {
      console.error('[gumroad-register] access configuration missing');
      return NextResponse.json({ ok:false, error:'Gumroad webhook registration is not configured.' }, { status:503 });
    }
    const webhookSecret = String(process.env.GUMROAD_WEBHOOK_SECRET || '').trim();
    if (!webhookSecret) {
      console.error('[gumroad-register] signing configuration missing');
      return NextResponse.json({ ok:false, error:'Gumroad webhook registration is not configured.' }, { status:503 });
    }

    const results = [];
    for (const resource of RESOURCES) {
      const form = new URLSearchParams();
      form.set('resource_name', resource);
      form.set('post_url', `${baseUrl(req)}/api/gumroad/webhook?resource=${resource}&token=${encodeURIComponent(webhookSecret)}`);
      const response = await fetch('https://api.gumroad.com/v2/resource_subscriptions', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
      const data = await response.json().catch(() => ({ success:false, error:'Could not parse Gumroad response.' }));
      results.push({
        resource,
        status: response.status,
        success: response.ok && data.success === true,
        error: response.ok && data.success === true ? null : String(data.error || 'Provider registration failed.').slice(0, 200)
      });
    }
    return NextResponse.json({ ok:true, results });
  } catch (error) {
    console.error('[gumroad-register] registration failed', { code: String(error?.code || 'registration_failed').slice(0, 100) });
    return NextResponse.json({ ok:false, error:'Gumroad webhooks could not be registered.' }, { status:500 });
  }
}
