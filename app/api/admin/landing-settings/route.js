import { NextResponse } from 'next/server';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';
import { DEFAULT_AMAZON_AFFILIATE_URL, normalizeAmazonAffiliateUrl } from '../../../../lib/amazonAffiliate.mjs';

export const dynamic = 'force-dynamic';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export async function GET(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);

    const { data, error } = await admin.supabase
      .from('site_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', 'amazon_affiliate_url')
      .maybeSingle();
    if (error) throw error;

    return privateResponse({
      ok: true,
      url: normalizeAmazonAffiliateUrl(data?.setting_value) || DEFAULT_AMAZON_AFFILIATE_URL,
      updatedAt: data?.updated_at || null
    });
  } catch (error) {
    console.error('[admin-landing-settings] load failed', {
      code: String(error?.code || 'settings_load_failed').slice(0, 80)
    });
    return privateResponse({ ok: false, error: 'Landing-page settings could not be loaded.' }, 500);
  }
}

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);

    const body = await request.json().catch(() => ({}));
    const url = normalizeAmazonAffiliateUrl(body?.amazonAffiliateUrl);
    if (!url) {
      return privateResponse({
        ok: false,
        error: 'Enter an HTTPS Amazon affiliate URL (amzn.to or an amazon.com address).'
      }, 400);
    }

    const updatedAt = new Date().toISOString();
    const { data, error } = await admin.supabase
      .from('site_settings')
      .upsert({
        setting_key: 'amazon_affiliate_url',
        setting_value: url,
        updated_at: updatedAt
      }, { onConflict: 'setting_key' })
      .select('setting_value, updated_at')
      .single();

    if (error) throw error;
    return privateResponse({
      ok: true,
      url: normalizeAmazonAffiliateUrl(data?.setting_value) || url,
      updatedAt: data?.updated_at || updatedAt
    });
  } catch (error) {
    console.error('[admin-landing-settings] save failed', {
      code: String(error?.code || 'settings_save_failed').slice(0, 80)
    });
    return privateResponse({ ok: false, error: 'The affiliate link could not be saved.' }, 500);
  }
}
