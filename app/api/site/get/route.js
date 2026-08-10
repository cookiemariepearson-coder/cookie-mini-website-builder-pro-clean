import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';

function fallbackSite(row){
  const saved = row.site || {
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
  const activeExtraPages = String(row.extra_page_subscription_status || '').toLowerCase() === 'active'
    ? Math.max(0, Number(row.extra_pages) || 0)
    : 0;
  return { ...saved, plan: row.plan || saved.plan || 'free', extraPages: activeExtraPages };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const ownerOnly = searchParams.get('owner') === '1';
    if (!slug) return NextResponse.json({ ok:false,error:'Missing slug' }, { status:400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ ok:false,error:'Not found' }, { status:404 });

    if (ownerOnly || String(data.status || '').toLowerCase() !== 'published') {
      const owner = await getVerifiedSiteOwner(req);
      if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
      if (!siteBelongsToOwner(data, owner)) {
        return NextResponse.json({ ok: false, error: 'This website belongs to a different verified email.' }, { status: 403 });
      }
    }

    return NextResponse.json({ ok:true, row:data, site: fallbackSite(data) });
  } catch(e) {
    console.error('[site-get] load failed', { message: e?.message || String(e) });
    return NextResponse.json({ ok:false,error:'The website could not be loaded right now. Please refresh and try again.' }, { status:500 });
  }
}
