import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { DEFAULT_AMAZON_AFFILIATE_URL, normalizeAmazonAffiliateUrl } from '../../../../lib/amazonAffiliate.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', 'amazon_affiliate_url')
      .maybeSingle();

    if (error) throw error;
    const url = normalizeAmazonAffiliateUrl(data?.setting_value) || DEFAULT_AMAZON_AFFILIATE_URL;
    return NextResponse.json({ ok: true, url, updatedAt: data?.updated_at || null }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.warn('[landing-affiliate]', {
      event: 'AFFILIATE_SETTING_FALLBACK',
      code: String(error?.code || 'settings_unavailable').slice(0, 80)
    });
    return NextResponse.json({ ok: true, url: DEFAULT_AMAZON_AFFILIATE_URL, updatedAt: null, fallback: true }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  }
}
