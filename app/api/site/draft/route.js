import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';

function friendlyError(message='') {
  if (message.includes('site') && message.includes('schema cache')) {
    return "Draft saved in browser, but online draft needs the site column. Run supabase/builder_draft_site_column_migration.sql in the Website Builder Supabase project.";
  }
  return message;
}

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });

    const body = await req.json();
    const site = body.site || body;
    const slug = slugify(site.slug || site.businessName);
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && !siteBelongsToOwner(existing, owner)) {
      return NextResponse.json({ ok: false, error: 'That website address already belongs to a different verified email. Choose another business or website name.' }, { status: 403 });
    }

    const protectedSite = { ...site, slug, customerEmail: owner.email, status: 'draft' };
    const row = {
      slug,
      owner_id: owner.user.id,
      customer_email: owner.email,
      business_name: site.businessName || null,
      plan: site.plan || 'free',
      status: 'draft',
      extra_pages: Number(site.extraPages || site.extra_pages || 0),
      monthly_price: site.plan === 'premium' ? 50 : site.plan === 'business' ? 30 : site.plan === 'starter' ? 19 : 0,
      site: protectedSite,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    await sendAdminNotification({ subject: `Draft saved: ${row.business_name || slug}`, event: 'Website draft saved', slug, businessName: row.business_name, customerEmail: row.customer_email, details: `Plan: ${row.plan}` });
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json({ ok: false, error: friendlyError(e.message) }, { status: 500 });
  }
}
