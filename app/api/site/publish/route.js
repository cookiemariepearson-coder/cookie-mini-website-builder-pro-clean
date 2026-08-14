import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { validateSiteMedia } from '../../../../lib/mediaValidation.mjs';
import { extraPageAccess, websitePlanAccess } from '../../../../lib/subscriptionLifecycle.mjs';

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
    const requestedPlan = site.plan || 'free';
    const paidPlans = new Set(['starter', 'business', 'premium']);
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && !siteBelongsToOwner(existing, owner)) {
      return privateResponse({ ok: false, error: 'That website address already belongs to a different verified email. Choose another business or website name.' }, 403);
    }
    if (existing && (String(existing.status || '').toLowerCase() === 'deleted' || existing.customer_deleted_at)) {
      return privateResponse({ ok: false, error: 'This website is in recoverable Trash. Contact support to recover it before publishing again.' }, 409);
    }

    if (paidPlans.has(requestedPlan)) {
      const paidAccess = existing
        && String(existing.plan || '').toLowerCase() === requestedPlan
        && websitePlanAccess(existing).active;
      if (!paidAccess) {
        return privateResponse({ ok: false, error: 'Your paid plan is not confirmed yet. Complete checkout and wait for payment confirmation before publishing.' }, 402);
      }
    }

    const plan = paidPlans.has(requestedPlan) ? requestedPlan : 'free';
    const monthly = plan === 'premium' ? 50 : plan === 'business' ? 30 : plan === 'starter' ? 19 : 0;

    const activeExtraPages = extraPageAccess(existing || {}).allowance;
    const protectedSite = { ...site, slug, customerEmail: owner.email, extraPages: activeExtraPages, status: 'published' };
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
    return privateResponse({ ok: true, slug, url: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com'}` });
  } catch (e) {
    console.error('[site-publish] publish failed', { message: e?.message || String(e) });
    return privateResponse({ ok: false, error: friendlyError() }, 500);
  }
}
