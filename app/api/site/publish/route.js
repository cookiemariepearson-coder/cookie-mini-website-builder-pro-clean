import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';

function friendlyError(message='') {
  if (message.includes('site') && message.includes('schema cache')) {
    return "Missing database field: run supabase/builder_draft_site_column_migration.sql in the Website Builder Supabase project, then wait one minute and try publishing again.";
  }
  if (message.includes('relation') && message.includes('websites')) {
    return "The websites table was not found. Run supabase/clean_websites_schema.sql first in the Website Builder Supabase project.";
  }
  return message;
}

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });

    const body = await req.json();
    const site = body.site || body;
    const businessSlug = slugify(site.businessName || site.draftName || '');
    if (!businessSlug || ['my-business-name', 'my-website', 'published-website'].includes(businessSlug)) {
      return NextResponse.json({ ok: false, error: 'Add a real business or website name before publishing. This creates a unique website address.' }, { status: 400 });
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
      return NextResponse.json({ ok: false, error: 'That website address already belongs to a different verified email. Choose another business or website name.' }, { status: 403 });
    }

    if (paidPlans.has(requestedPlan)) {
      const paidAccess = existing
        && String(existing.plan || '').toLowerCase() === requestedPlan
        && String(existing.subscription_status || '').toLowerCase() === 'active'
        && String(existing.access_status || '').toLowerCase() === 'active';
      if (!paidAccess) {
        return NextResponse.json({ ok: false, error: 'Your paid plan is not confirmed yet. Complete checkout and wait for payment confirmation before publishing.' }, { status: 402 });
      }
    }

    const plan = paidPlans.has(requestedPlan) ? requestedPlan : 'free';
    const monthly = plan === 'premium' ? 50 : plan === 'business' ? 30 : plan === 'starter' ? 19 : 0;

    const protectedSite = { ...site, slug, customerEmail: owner.email, status: 'published' };
    const row = {
      slug,
      owner_id: owner.user.id,
      customer_email: owner.email,
      business_name: site.businessName || null,
      plan,
      status: 'published',
      extra_pages: Number(site.extraPages || site.extra_pages || 0),
      monthly_price: monthly,
      site: protectedSite,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    await sendAdminNotification({ subject: `Website published: ${row.business_name || slug}`, event: 'Website published', slug, businessName: row.business_name, customerEmail: row.customer_email, details: `Plan: ${row.plan}` });
    return NextResponse.json({ ok: true, slug, url: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com'}` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: friendlyError(e.message) }, { status: 500 });
  }
}
