import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { extraPageAccess } from '../../../../lib/subscriptionLifecycle.mjs';

export const dynamic = 'force-dynamic';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
export const runtime = 'nodejs';

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
  const activeExtraPages = extraPageAccess(row).allowance;
  return { ...saved, plan: row.plan || saved.plan || 'free', extraPages: activeExtraPages };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const ownerOnly = searchParams.get('owner') === '1';
    if (!slug) return privateResponse({ ok:false,error:'Missing slug' }, 400);
    let owner = null;
    if (ownerOnly) {
      owner = await getVerifiedSiteOwner(req);
      if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
    }
    const supabase = owner?.supabase || getSupabaseAdmin();
    const { data, error } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) return privateResponse({ ok:false,error:'Not found' }, 404);

    if (ownerOnly || String(data.status || '').toLowerCase() !== 'published') {
      owner = owner || await getVerifiedSiteOwner(req);
      if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
      if (!siteBelongsToOwner(data, owner)) {
        return privateResponse({ ok: false, error: 'You do not have access to manage this website.' }, 403);
      }
    }

    return NextResponse.json({ ok:true, row:data, site: fallbackSite(data) }, {
      headers: { 'Cache-Control': ownerOnly ? 'private, no-store, max-age=0' : 'public, max-age=0, must-revalidate' }
    });
  } catch(e) {
    console.error('[site-get] load failed', { message: e?.message || String(e) });
    return privateResponse({ ok:false,error:'The website could not be loaded right now. Please refresh and try again shortly.' }, 500);
  }
}
