import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedSiteOwner, siteBelongsToEmail } from '../../../../lib/siteOwnerAuth';

export async function POST(req) {
  try {
    const owner = await getVerifiedSiteOwner(req);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });

    const body = await req.json();
    const { slug, site } = body;
    if (!slug || !site) return NextResponse.json({ ok:false,error:'Missing slug or site' }, { status:400 });
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ ok: false, error: 'Website not found.' }, { status: 404 });
    if (!siteBelongsToEmail(existing, owner.email)) {
      return NextResponse.json({ ok: false, error: 'This website belongs to a different verified email.' }, { status: 403 });
    }

    const protectedSite = { ...site, slug, customerEmail: owner.email, status: 'published' };
    const { data: updated, error } = await supabase.from('websites').update({
      customer_email: owner.email,
      business_name: protectedSite.businessName || null,
      plan: site.plan || 'free',
      extra_pages: Number(site.extraPages || 0),
      site: protectedSite,
      updated_at: new Date().toISOString()
    }).eq('slug', slug).select('slug').maybeSingle();
    if (error) throw error;
    if (!updated) return NextResponse.json({ ok: false, error: 'Website was not updated.' }, { status: 404 });
    await sendAdminNotification({
      subject: `Website updated: ${site.businessName || slug}`,
      event: 'Website edited and republished',
      slug,
      businessName: site.businessName,
      customerEmail: owner.email,
      details: 'An owner or authorized editor saved changes through the website editor.'
    });
    return NextResponse.json({ ok:true });
  } catch(e) { return NextResponse.json({ ok:false,error:e.message }, { status:500 }); }
}
