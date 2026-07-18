import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';

function friendlyError(message='') {
  if (message.includes('site') && message.includes('schema cache')) {
    return "Draft saved in browser, but online draft needs the site column. Run supabase/builder_draft_site_column_migration.sql in the Website Builder Supabase project.";
  }
  return message;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const site = body.site || body;
    const slug = slugify(site.slug || site.businessName);
    const supabase = getSupabaseAdmin();
    const row = {
      slug,
      customer_email: site.customerEmail || site.email || null,
      business_name: site.businessName || null,
      plan: site.plan || 'free',
      status: 'draft',
      extra_pages: Number(site.extraPages || site.extra_pages || 0),
      monthly_price: site.plan === 'premium' ? 50 : site.plan === 'business' ? 30 : site.plan === 'starter' ? 19 : 0,
      site: { ...site, slug, status: 'draft' },
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json({ ok: false, error: friendlyError(e.message) }, { status: 500 });
  }
}
