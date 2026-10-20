import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { DEFAULT_AMAZON_AFFILIATE_URL, safeAmazonAffiliateUrl } from '../../../lib/amazonAffiliate.mjs';

export const dynamic = 'force-dynamic';

function response(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('landing_settings')
      .select('setting_value')
      .eq('setting_key', 'amazon_affiliate_url')
      .maybeSingle();

    if (error) throw error;
    return response({ ok: true, amazonAffiliateUrl: safeAmazonAffiliateUrl(data?.setting_value || DEFAULT_AMAZON_AFFILIATE_URL) });
  } catch (error) {
    // Keep the public landing page available if the settings table is not available yet.
    console.warn('[landing-settings]', { event: 'AFFILIATE_SETTING_READ_FALLBACK', code: String(error?.code || 'settings_unavailable').slice(0, 80) });
    return response({ ok: true, amazonAffiliateUrl: DEFAULT_AMAZON_AFFILIATE_URL });
  }
}
