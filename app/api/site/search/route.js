import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { slugify } from '../../../../lib/siteDefaults';
import { getVerifiedSiteOwner } from '../../../../lib/siteOwnerAuth';

function normalizeSlug(input = '') {
  let value = String(input || '').trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
  value = value.split('/')[0].split('?')[0].split('#')[0];
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com';
  if (value.endsWith('.' + root)) value = value.slice(0, -1 * (root.length + 1));
  if (value === root) value = '';
  return slugify(value);
}

function siteFromRow(row) {
  return row.site || {
    slug: row.slug,
    businessName: row.business_name || 'Saved Website',
    customerEmail: row.customer_email || '',
    plan: row.plan || 'free',
    status: row.status || 'draft'
  };
}

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) {
      return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    }

    const body = await req.json();
    const email = owner.email;
    const rawQuery = String(body.query || body.slug || '').trim();
    const slug = rawQuery ? normalizeSlug(rawQuery) : '';
    if (!email && !slug) {
      return NextResponse.json({ ok: false, error: 'Enter an email address or website name/subdomain.' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const found = new Map();

    async function addRows(q) {
      const { data, error } = await q;
      if (error) throw error;
      (data || []).forEach(row => found.set(row.slug, row));
    }

    if (email) {
      await addRows(supabase.from('websites').select('*').eq('customer_email', email).order('updated_at', { ascending: false }).limit(50));
    }
    if (slug && slug !== 'my-website') {
      const safeTerm = slug.replace(/[%_,()]/g, '');
      if (safeTerm.length >= 2) {
        const spacedTerm = safeTerm.replace(/-/g, ' ');
        await addRows(
          supabase
            .from('websites')
            .select('*')
            .eq('customer_email', email)
            .or(`slug.ilike.%${safeTerm}%,business_name.ilike.%${safeTerm}%,business_name.ilike.%${spacedTerm}%`)
            .order('updated_at', { ascending: false })
            .limit(25)
        );
      }
    }
    const sites = Array.from(found.values()).sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || ''))).map(row => ({
      slug: row.slug,
      business_name: row.business_name || siteFromRow(row).businessName || row.slug,
      customer_email: row.customer_email || siteFromRow(row).customerEmail || '',
      plan: row.plan || siteFromRow(row).plan || 'free',
      status: row.status || siteFromRow(row).status || 'draft',
      access_status: row.access_status || 'active',
      subscription_status: row.subscription_status || 'unverified',
      monthly_price: row.monthly_price || 0,
      extra_pages: row.extra_pages || 0,
      updated_at: row.updated_at,
      site: siteFromRow(row)
    }));

    return NextResponse.json({ ok: true, sites });
  } catch (e) {
    console.error('[site-search] lookup failed', { message: e?.message || String(e) });
    return NextResponse.json({ ok: false, error: 'Saved websites could not be searched right now. Please try again shortly.' }, { status: 500 });
  }
}
