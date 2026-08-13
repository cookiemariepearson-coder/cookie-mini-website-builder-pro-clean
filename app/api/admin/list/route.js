import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(req) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(250);
    if (error) throw error;
    console.info('[admin-list]', { event: 'OWNER_WEBSITE_SEARCH_LOADED', resultCount: (data || []).length });
    return privateResponse({ ok: true, sites: data || [] });
  } catch (e) {
    console.error('[admin-list] load failed', { message: e?.message || String(e) });
    return privateResponse({ ok: false, error: 'Admin website records could not be loaded.' }, 500);
  }
}
