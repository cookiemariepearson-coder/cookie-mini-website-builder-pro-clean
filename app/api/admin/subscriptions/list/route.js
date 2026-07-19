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
      supabase.from('websites').select('id,slug,business_name,businessName,customer_email,email,plan,status,subscription_status,access_status,gumroad_email,gumroad_product_name,gumroad_last_event,gumroad_last_event_at,last_payment_at,paused_reason,extra_page_subscription_status,extra_pages,admin_notes,updated_at').order('updated_at', { ascending:false }).limit(200),
      supabase.from('gumroad_events').select('*').order('processed_at', { ascending:false }).limit(100)
    ]);
    if (wError) throw wError;
    if (eError) throw eError;
    return NextResponse.json({ ok:true, websites:websites || [], events:events || [] });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  }
}
