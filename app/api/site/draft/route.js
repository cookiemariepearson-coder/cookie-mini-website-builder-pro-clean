import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { validateSiteMedia } from '../../../../lib/mediaValidation.mjs';

function friendlyError(message='') {
  return 'The online draft could not be saved. Your browser copy is still available; please try again shortly.';
}

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });

    const limited = rateLimit(req, { name: 'site-draft', limit: 30, windowMs: 15 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a few minutes before saving this draft again.');

    const body = await req.json();
    const site = body.site || body;
    const mediaCheck = validateSiteMedia(site);
    if (!mediaCheck.ok) return NextResponse.json({ ok: false, error: mediaCheck.error }, { status: 400 });
    const slug = slugify(site.slug || site.businessName);
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && !siteBelongsToOwner(existing, owner)) {
      return NextResponse.json({ ok: false, error: 'That website address already belongs to a different verified email. Choose another business or website name.' }, { status: 403 });
    }

    const activeExtraPages = String(existing?.extra_page_subscription_status || '').toLowerCase() === 'active'
      ? Math.max(0, Number(existing?.extra_pages) || 0)
      : 0;
    const protectedSite = { ...site, slug, customerEmail: owner.email, extraPages: activeExtraPages, status: 'draft' };
    const authoritativePlan = existing?.plan || 'free';
    const row = {
      slug,
      owner_id: owner.user.id,
      customer_email: owner.email,
      business_name: site.businessName || null,
      plan: authoritativePlan,
      status: existing?.status === 'published' ? 'published' : 'draft',
      extra_pages: Math.max(0, Number(existing?.extra_pages) || 0),
      monthly_price: authoritativePlan === 'premium' ? 50 : authoritativePlan === 'business' ? 30 : authoritativePlan === 'starter' ? 19 : 0,
      site: protectedSite,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    await sendAdminNotification({ subject: `Draft saved: ${row.business_name || slug}`, event: 'Website draft saved', slug, businessName: row.business_name, customerEmail: row.customer_email, details: `Plan: ${row.plan}` });
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    console.error('[site-draft] save failed', { message: e?.message || String(e) });
    return NextResponse.json({ ok: false, error: friendlyError() }, { status: 500 });
  }
}
