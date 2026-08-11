import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { slugify } from '../../../../lib/siteDefaults';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    const limited = rateLimit(request, { name: 'site-manage', limit: 12, windowMs: 15 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before changing another website.');
    const body = await request.json().catch(() => ({}));
    const slug = slugify(body.slug || '');
    const action = String(body.action || '').toLowerCase();
    if (!slug || !['archive', 'delete'].includes(action)) return NextResponse.json({ ok: false, error: 'Choose a valid website action.' }, { status: 400 });
    const { data: site, error } = await owner.supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!site) return NextResponse.json({ ok: false, error: 'Website not found.' }, { status: 404 });
    if (!siteBelongsToOwner(site, owner)) return NextResponse.json({ ok: false, error: 'This website belongs to a different customer.' }, { status: 403 });

    if (action === 'archive') {
      const { error: archiveError } = await owner.supabase.from('websites').update({ access_status: 'archived', status: 'archived', updated_at: new Date().toISOString() }).eq('id', site.id).eq('owner_id', owner.user.id);
      if (archiveError) throw archiveError;
      return NextResponse.json({ ok: true, message: 'Website archived. Contact support if you need it restored.' });
    }

    const activePaid = ['starter', 'business', 'premium'].includes(String(site.plan || '').toLowerCase()) || String(site.subscription_status || '').toLowerCase() === 'active';
    if (activePaid || String(site.status || '').toLowerCase() !== 'draft') {
      return NextResponse.json({ ok: false, error: 'Only an unpublished free draft can be deleted here. Archive this website or contact support so purchases and live access are protected.' }, { status: 409 });
    }
    const { count, error: intentError } = await owner.supabase.from('website_checkout_intents').select('id', { count: 'exact', head: true }).eq('website_id', site.id);
    if (intentError) throw intentError;
    if (count) return NextResponse.json({ ok: false, error: 'This draft has checkout history and cannot be deleted automatically. Archive it instead.' }, { status: 409 });
    const { error: deleteError } = await owner.supabase.from('websites').delete().eq('id', site.id).eq('owner_id', owner.user.id);
    if (deleteError) throw deleteError;
    return NextResponse.json({ ok: true, message: 'Unpublished free draft deleted.' });
  } catch (error) {
    console.error('[site-manage] customer action failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The website action could not be completed. Your website remains unchanged.' }, { status: 500 });
  }
}
