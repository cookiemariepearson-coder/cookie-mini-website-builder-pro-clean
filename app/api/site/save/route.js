import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { validateSiteMedia } from '../../../../lib/mediaValidation.mjs';
import { normalizeSelectedPagesForPlan } from '../../../../lib/siteDefaults';
import { extraPageAccess, websitePlanAccess } from '../../../../lib/subscriptionLifecycle.mjs';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
    const limited = rateLimit(req, { name: 'site-save', limit: 20, windowMs: 15 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a few minutes before republishing again.');

    const body = await req.json();
    const { slug, site } = body;
    if (!slug || !site) return privateResponse({ ok:false,error:'Missing slug or site' }, 400);
    const mediaCheck = validateSiteMedia(site);
    if (!mediaCheck.ok) return privateResponse({ ok: false, error: mediaCheck.error }, 400);
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return privateResponse({ ok: false, error: 'Website not found.' }, 404);
    if (!siteBelongsToOwner(existing, owner)) {
      return privateResponse({ ok: false, error: 'This website belongs to a different verified email.' }, 403);
    }

    const currentStatus = String(existing.status || 'draft').toLowerCase();
    const currentAccess = String(existing.access_status || 'active').toLowerCase();
    if (existing.customer_deleted_at || ['deleted', 'archived', 'paused', 'inactive'].includes(currentStatus) || ['archived', 'deleted', 'paused', 'inactive'].includes(currentAccess)) {
      return privateResponse({ ok: false, error: 'This website is not available for editing. Contact support if it should be recovered.' }, 409);
    }

    if (websitePlanAccess(existing).paid && !websitePlanAccess(existing).active) {
      return privateResponse({ ok: false, error: 'This paid plan is not currently active. Your edits remain on this screen; check the membership from your Gumroad receipt or Library.' }, 402);
    }

    const authoritativePlan = existing.plan || 'free';
    const activeExtraPages = extraPageAccess(existing).allowance;
    const protectedSite = {
      ...site,
      slug,
      plan: authoritativePlan,
      extraPages: activeExtraPages,
      pages: normalizeSelectedPagesForPlan(site.pages, authoritativePlan, activeExtraPages),
      customerEmail: owner.email,
      status: 'published'
    };
    let updateQuery = supabase.from('websites').update({
      customer_email: owner.email,
      owner_id: owner.user.id,
      business_name: protectedSite.businessName || null,
      site: protectedSite,
      status: 'published',
      customer_unpublished_at: null,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id);
    updateQuery = existing.owner_id
      ? updateQuery.eq('owner_id', owner.user.id)
      : updateQuery.is('owner_id', null).ilike('customer_email', owner.email);
    const { data: updated, error } = await updateQuery.select('slug').maybeSingle();
    if (error) throw error;
    if (!updated) return privateResponse({ ok: false, error: 'You do not have access to republish this website.' }, 403);
    await sendAdminNotification({
      subject: `Website updated: ${site.businessName || slug}`,
      event: 'Website edited and republished',
      slug,
      businessName: site.businessName,
      customerEmail: owner.email,
      details: 'An owner or authorized editor saved changes through the website editor.'
    });
    return privateResponse({ ok:true });
  } catch(e) {
    console.error('[site-save] republish failed', { message: e?.message || String(e) });
    return privateResponse({ ok:false,error:'The website could not be republished. Your changes are still on this screen; please try again shortly.' }, 500);
  }
}
