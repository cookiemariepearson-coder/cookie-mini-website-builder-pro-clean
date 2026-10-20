import { NextResponse } from 'next/server';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizeAmazonAffiliateUrl } from '../../../../lib/amazonAffiliate.mjs';

export const dynamic = 'force-dynamic';

function response(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export async function POST(request) {
  try {
    const requestOrigin = new URL(request.url).origin;
    const origin = request.headers.get('origin');
    if (origin && origin !== requestOrigin) return response({ ok: false, error: 'This settings request must come from the Mini Website Builder.' }, 403);

    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return response({ ok: false, error: admin.error }, admin.status);

    const body = await request.json().catch(() => ({}));
    const amazonAffiliateUrl = normalizeAmazonAffiliateUrl(body.amazonAffiliateUrl);
    if (!amazonAffiliateUrl) {
      return response({ ok: false, error: 'Enter an HTTPS amzn.to short link or an Amazon.com product link.' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('landing_settings')
      .upsert({
        setting_key: 'amazon_affiliate_url',
        setting_value: amazonAffiliateUrl,
        updated_at: new Date().toISOString(),
        updated_by: admin.email
      }, { onConflict: 'setting_key' });

    if (error) throw error;
    console.info('[admin-landing-settings]', { event: 'AMAZON_AFFILIATE_LINK_SAVED' });
    return response({ ok: true, amazonAffiliateUrl });
  } catch (error) {
    console.error('[admin-landing-settings] save failed', { code: String(error?.code || 'settings_save_failed').slice(0, 80) });
    return response({ ok: false, error: 'The weekly Amazon link could not be saved. No other settings were changed.' }, 500);
  }
}
