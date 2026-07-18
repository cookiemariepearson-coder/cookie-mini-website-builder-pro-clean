import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';

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
    const body = await req.json();
    const site = body.site || body;
    const slug = slugify(site.slug || site.businessName);
    const plan = site.plan || 'free';
    const monthly = plan === 'premium' ? 50 : plan === 'business' ? 30 : plan === 'starter' ? 19 : 0;
    const supabase = getSupabaseAdmin();
    const row = {
      slug,
      customer_email: String(site.customerEmail || site.email || '').trim().toLowerCase() || null,
      business_name: site.businessName || null,
      plan,
      status: 'published',
      extra_pages: Number(site.extraPages || site.extra_pages || 0),
      monthly_price: monthly,
      site: { ...site, slug, status: 'published' },
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    return NextResponse.json({ ok: true, slug, url: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com'}` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: friendlyError(e.message) }, { status: 500 });
  }
}
