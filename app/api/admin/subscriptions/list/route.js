import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { pin } = await req.json();
    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ ok:false, error:'Invalid admin PIN.' }, { status:401 });
    }
    const supabase = getSupabaseAdmin();
    const [{ data: websites, error: wError }, { data: events, error: eError }] = await Promise.all([
      supabase.from('websites').select('*').order('updated_at', { ascending:false }).limit(200),
      supabase.from('gumroad_events').select('*').order('processed_at', { ascending:false }).limit(100)
    ]);
    if (wError) throw wError;
    if (eError) throw eError;
    return NextResponse.json({ ok:true, websites:websites || [], events:events || [] });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  }
}
