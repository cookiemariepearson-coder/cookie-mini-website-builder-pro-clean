import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';

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
      status: 'published',
      extra_pages: Number(site.extraPages || 0),
      monthly_price: site.plan === 'premium' ? 50 : site.plan === 'business' ? 30 : site.plan === 'starter' ? 19 : 0,
      site: { ...site, slug },
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('websites').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    return NextResponse.json({ ok: true, slug, url: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com'}` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
