import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { sendAdminNotification } from '../../../../lib/adminNotifications';

export async function POST(req) {
  try {
    const body = await req.json();
    const { slug, site } = body;
    if (!slug || !site) return NextResponse.json({ ok:false,error:'Missing slug or site' }, { status:400 });
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('websites').update({
      customer_email: String(site.customerEmail || site.email || '').trim().toLowerCase() || null,
      business_name: site.businessName || null,
      plan: site.plan || 'free',
      extra_pages: Number(site.extraPages || 0),
      site,
      updated_at: new Date().toISOString()
    }).eq('slug', slug);
    if (error) throw error;
    await sendAdminNotification({
      subject: `Website updated: ${site.businessName || slug}`,
      event: 'Website edited and republished',
      slug,
      businessName: site.businessName,
      customerEmail: site.customerEmail || site.email,
      details: 'An owner or authorized editor saved changes through the website editor.'
    });
    return NextResponse.json({ ok:true });
  } catch(e) { return NextResponse.json({ ok:false,error:e.message }, { status:500 }); }
}
