import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    const { pin } = await req.json();
    if (pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ ok: false, error: 'Invalid PIN' }, { status: 401 });
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, sites: data || [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
