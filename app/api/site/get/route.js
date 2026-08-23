import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { extraPageAccess, websitePlanAccess } from '../../../../lib/subscriptionLifecycle.mjs';
import { normalizeWebsitePlan } from '../../../../lib/websitePublishPolicy.mjs';

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
    const websiteId = String(searchParams.get('id') || '').trim();
    const ownerOnly = searchParams.get('owner') === '1';
    if (!slug && !websiteId) return privateResponse({ ok:false,error:'Missing website reference' }, 400);
    if (websiteId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(websiteId)) {
      return privateResponse({ ok:false,error:'Invalid website reference' }, 400);
    }
    let owner = null;
    if (ownerOnly) {
      owner = await getVerifiedSiteOwner(req);
      if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
    }
    const supabase = owner?.supabase || getSupabaseAdmin();
    let websiteQuery = supabase.from('websites').select('*');
    websiteQuery = websiteId ? websiteQuery.eq('id', websiteId) : websiteQuery.eq('slug', slug);
    const { data, error } = await websiteQuery.maybeSingle();
    if (error) throw error;
    if (!data) return privateResponse({ ok:false,error:'Not found' }, 404);

    if (ownerOnly || String(data.status || '').toLowerCase() !== 'published') {
      owner = owner || await getVerifiedSiteOwner(req);
      if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
      if (!siteBelongsToOwner(data, owner)) {
        return privateResponse({ ok: false, error: 'You do not have access to manage this website.' }, 403);
      }
      if (String(data.status || '').toLowerCase() === 'deleted' || data.customer_deleted_at) {
        return privateResponse({ ok: false, error: 'This website is in recoverable Trash and is no longer available in My Websites.' }, 410);
      }
    }

    let site = fallbackSite(data);
    let planAccess = null;
    let latestCheckoutIntent = null;
    if (ownerOnly) {
      const { data: latestIntent, error: intentError } = await supabase.from('website_checkout_intents')
        .select('id,plan,status,website_id,draft_slug,created_at')
        .eq('owner_id', owner.user.id)
        .or(`website_id.eq.${data.id},draft_slug.eq.${data.slug}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (intentError) throw intentError;
      latestCheckoutIntent = latestIntent;
      const storedPlan = normalizeWebsitePlan(data.plan) || 'free';
      const savedPlan = normalizeWebsitePlan(data.site?.plan);
      const intentPlan = normalizeWebsitePlan(latestIntent?.plan);
      const intendedPaidPlan = [storedPlan, savedPlan, intentPlan].find(plan => ['starter', 'business', 'premium'].includes(plan));
      if (intendedPaidPlan) {
        site = { ...site, plan: intendedPaidPlan };
        planAccess = storedPlan === intendedPaidPlan ? 'stored_plan' : 'checkout_not_confirmed';
      }
    }
    const access = websitePlanAccess({ ...data, plan: site.plan });
    site = {
      ...site,
      websiteId: data.id,
      draftId: data.id,
      slug: data.slug,
      builderStep: Number.isInteger(Number(site.builderStep)) ? Number(site.builderStep) : 1
    };
    return NextResponse.json({
      ok:true,
      row:data,
      site,
      planAccess,
      checkoutState: planAccess === 'checkout_not_confirmed' ? 'checkout_not_confirmed' : access.active && access.paid ? 'verified_entitlement' : access.paid ? 'entitlement_inactive' : 'free',
      checkoutIntent: latestCheckoutIntent ? { id: latestCheckoutIntent.id, plan: latestCheckoutIntent.plan, status: latestCheckoutIntent.status } : null,
      publishAccess: { allowed: access.active, paid: access.paid, reason: access.reason }
    }, {
      headers: { 'Cache-Control': ownerOnly ? 'private, no-store, max-age=0' : 'public, max-age=0, must-revalidate' }
    });
  } catch(e) {
    console.error('[site-get] load failed', { message: e?.message || String(e) });
    return privateResponse({ ok:false,error:'The website could not be loaded right now. Please refresh and try again shortly.' }, 500);
  }
}
