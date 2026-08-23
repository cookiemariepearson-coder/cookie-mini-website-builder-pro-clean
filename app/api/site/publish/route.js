import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { validateSiteMedia } from '../../../../lib/mediaValidation.mjs';
import { extraPageAccess } from '../../../../lib/subscriptionLifecycle.mjs';
import { enforceFreePublishingLimits, missingSelectedActionDestination, publishPlanDecision } from '../../../../lib/websitePublishPolicy.mjs';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

function friendlyError(message='') {
  return 'The website could not be published right now. Your draft remains saved; please try again shortly.';
}

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
    const limited = rateLimit(req, { name: 'site-publish', limit: 20, windowMs: 15 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a few minutes before publishing again.');

    const body = await req.json();
    const site = body.site || body;
    const mediaCheck = validateSiteMedia(site);
    if (!mediaCheck.ok) return privateResponse({ ok: false, error: mediaCheck.error }, 400);
    const businessSlug = slugify(site.businessName || site.draftName || '');
    if (!businessSlug || ['my-business-name', 'my-website', 'published-website'].includes(businessSlug)) {
      return privateResponse({ ok: false, error: 'Add a real business or website name before publishing. This creates a unique website address.' }, 400);
    }
    const requestedSlug = slugify(site.slug || '');
    const placeholderSlugs = new Set(['my-website', 'my-business-name', 'published-website']);
    const slug = requestedSlug && !placeholderSlugs.has(requestedSlug)
      ? requestedSlug
      : slugify(site.draftName || site.businessName || 'my-website');
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && !siteBelongsToOwner(existing, owner)) {
      return privateResponse({ ok: false, error: 'That website address already belongs to a different verified email. Choose another business or website name.' }, 403);
    }
    if (existing && (String(existing.status || '').toLowerCase() === 'deleted' || existing.customer_deleted_at)) {
      return privateResponse({ ok: false, error: 'This website is in recoverable Trash. Contact support to recover it before publishing again.' }, 409);
    }

    let checkoutIntent = null;
    if (existing) {
      const { data: latestIntent, error: intentError } = await supabase.from('website_checkout_intents')
        .select('id,plan,status,website_id,draft_slug,owner_id,created_at')
        .eq('owner_id', owner.user.id)
        .or(`website_id.eq.${existing.id},draft_slug.eq.${slug}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (intentError) throw intentError;
      checkoutIntent = latestIntent;
    }
    const decision = publishPlanDecision(existing || {}, site, checkoutIntent);
    if (!decision.allowed) return privateResponse({ ok: false, reasonCode: decision.code, error: decision.message }, 402);
    const plan = decision.plan;
    const monthly = plan === 'premium' ? 50 : plan === 'business' ? 30 : plan === 'starter' ? 19 : 0;

    const activeExtraPages = extraPageAccess(existing || {}).allowance;
    const missingAction = missingSelectedActionDestination(site, plan, activeExtraPages);
    if (missingAction) return privateResponse({ ok: false, reasonCode: 'ACTION_DESTINATION_REQUIRED', fieldId: missingAction.fieldId, error: missingAction.message }, 422);
    const planLimitedSite = plan === 'free' ? enforceFreePublishingLimits(site) : site;
    const protectedSite = { ...planLimitedSite, slug, plan, customerEmail: owner.email, extraPages: activeExtraPages, status: 'published' };
    const row = {
      slug,
      owner_id: owner.user.id,
      customer_email: owner.email,
      business_name: site.businessName || null,
      plan,
      status: 'published',
      extra_pages: Math.max(0, Number(existing?.extra_pages) || 0),
      monthly_price: monthly,
      site: protectedSite,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    await sendAdminNotification({ subject: `Website published: ${row.business_name || slug}`, event: 'Website published', slug, businessName: row.business_name, customerEmail: row.customer_email, details: `Plan: ${row.plan}` });
    return privateResponse({ ok: true, slug, publishDecision: decision.code, url: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com'}` });
  } catch (e) {
    console.error('[site-publish] publish failed', { message: e?.message || String(e) });
    return privateResponse({ ok: false, error: friendlyError() }, 500);
  }
}
