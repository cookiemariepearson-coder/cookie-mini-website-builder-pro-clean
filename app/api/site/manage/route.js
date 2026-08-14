import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner, siteBelongsToOwner } from '../../../../lib/siteOwnerAuth';
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit.mjs';
import { slugify } from '../../../../lib/siteDefaults';
import {
  deletedWebsiteUpdate,
  unpublishedWebsiteUpdate,
  websiteDeletionConfirmationMatches
} from '../../../../lib/customerWebsiteManagement.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export async function POST(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return privateResponse({ ok: false, error: owner.error }, owner.status);
    const limited = rateLimit(request, { name: 'site-manage', limit: 12, windowMs: 15 * 60 * 1000, subject: owner.user.id });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before changing another website.');
    const body = await request.json().catch(() => ({}));
    const slug = slugify(body.slug || '');
    const action = String(body.action || '').toLowerCase();
    if (!slug || !['archive', 'unpublish', 'delete'].includes(action)) return privateResponse({ ok: false, error: 'Choose a valid website action.' }, 400);
    const { data: foundSite, error } = await owner.supabase.from('websites').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!foundSite) return privateResponse({ ok: false, error: 'Website not found.' }, 404);
    if (!siteBelongsToOwner(foundSite, owner)) return privateResponse({ ok: false, error: 'You do not have access to manage this website.' }, 403);
    let site = foundSite;
    if (!site.owner_id) {
      const { data: claimed, error: claimError } = await owner.supabase
        .from('websites')
        .update({ owner_id: owner.user.id, customer_email: owner.email, updated_at: new Date().toISOString() })
        .eq('id', site.id)
        .is('owner_id', null)
        .ilike('customer_email', owner.email)
        .select('*')
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) return privateResponse({ ok: false, error: 'You do not have access to manage this website.' }, 403);
      site = claimed;
    }

    if (action === 'archive') {
      const { error: archiveError } = await owner.supabase.from('websites').update({ access_status: 'archived', status: 'archived', updated_at: new Date().toISOString() }).eq('id', site.id).eq('owner_id', owner.user.id);
      if (archiveError) throw archiveError;
      return privateResponse({ ok: true, message: 'Website archived. Contact support if you need it restored.' });
    }

    const currentStatus = String(site.status || 'draft').toLowerCase();
    if (currentStatus === 'deleted' || site.customer_deleted_at) {
      return privateResponse({ ok: false, error: 'This website is already in Trash. No duplicate deletion was made.' }, 409);
    }

    if (action === 'unpublish') {
      if (currentStatus !== 'published') {
        return privateResponse({ ok: true, status: 'draft', updatedAt: site.updated_at, message: 'This website is already unpublished. Its content remains saved.' });
      }
      const updates = unpublishedWebsiteUpdate(site);
      const { data: changed, error: unpublishError } = await owner.supabase
        .from('websites')
        .update(updates)
        .eq('id', site.id)
        .eq('owner_id', owner.user.id)
        .eq('status', 'published')
        .select('status,updated_at')
        .maybeSingle();
      if (unpublishError) throw unpublishError;
      if (!changed) return privateResponse({ ok: false, error: 'The website changed before this request completed. Refresh My Websites and try again.' }, 409);
      return privateResponse({
        ok: true,
        status: 'draft',
        updatedAt: changed.updated_at,
        message: 'Website unpublished. Visitors can no longer open it, but your content remains saved and ready to edit or publish again.'
      });
    }

    if (!websiteDeletionConfirmationMatches(site, body.confirmation)) {
      return privateResponse({ ok: false, error: 'The website name did not match. Nothing was deleted.' }, 400);
    }

    const updates = deletedWebsiteUpdate(site);
    const { data: deleted, error: deleteError } = await owner.supabase
      .from('websites')
      .update(updates)
      .eq('id', site.id)
      .eq('owner_id', owner.user.id)
      .neq('status', 'deleted')
      .is('customer_deleted_at', null)
      .select('status,customer_deleted_at')
      .maybeSingle();
    if (deleteError) throw deleteError;
    if (!deleted) return privateResponse({ ok: false, error: 'This website is already in Trash. No duplicate deletion was made.' }, 409);
    return privateResponse({
      ok: true,
      status: 'deleted',
      message: 'Website moved to recoverable Trash. It is no longer public or shown in My Websites. Your account, plan, subscription, purchase history, other websites, and AI Videos were not changed.'
    });
  } catch (error) {
    console.error('[site-manage] customer action failed', { message: error?.message || String(error) });
    return privateResponse({ ok: false, error: 'The website action could not be completed. Your website remains unchanged.' }, 500);
  }
}
