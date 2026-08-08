import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedAdmin } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin.ok) return NextResponse.json({ ok:false, error:admin.error }, { status:admin.status });
    const supabase = getSupabaseAdmin();
    const [{ data: websites, error: wError }, { data: events, error: eError }] = await Promise.all([
      supabase.from('websites').select('*').order('updated_at', { ascending:false }).limit(200),
      supabase.from('gumroad_events').select('*').order('processed_at', { ascending:false }).limit(100)
    ]);
    if (wError) throw wError;
    if (eError) throw eError;
    return NextResponse.json({ ok:true, websites:websites || [], events:events || [] });
  } catch (error) {
    console.error('[admin-subscriptions] load failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok:false, error:'Subscription records could not be loaded.' }, { status:500 });
  }
}
