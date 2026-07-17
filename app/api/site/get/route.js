import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

function fallbackSite(row){
  return row.site || {
    businessName: row.business_name || row.businessName || 'Published Website',
    customerEmail: row.customer_email || row.email || '',
    plan: row.plan || 'starter',
    headline: row.headline || 'A beautiful website created in minutes.',
    description: row.description || '',
    primaryColor: row.primaryColor || '#20172f',
    accentColor: row.accentColor || '#c46a2d',
    typeKey: row.template || 'local',
    pages: row.pages || ['Home','Services','Contact'],
    offers: [{title:'Main Service',text:'Describe your offer.'},{title:'Highlights',text:'Share why customers choose you.'},{title:'Contact',text:'Tell people how to reach you.'}],
    sections: {}
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ ok:false,error:'Missing slug' }, { status:400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ ok:false,error:'Not found' }, { status:404 });
    return NextResponse.json({ ok:true, row:data, site: fallbackSite(data) });
  } catch(e) { return NextResponse.json({ ok:false,error:e.message }, { status:500 }); }
}
