import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(req) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);
    const { slug, updates } = await req.json();
    if (!slug) {
      return privateResponse({ ok: false, error: 'Missing website slug' }, 400);
    }

    const prohibited = ['plan', 'extra_pages', 'monthly_price', 'customer_email', 'owner_id', 'subscription_status', 'access_status'];
    if (prohibited.some(key => updates?.[key] !== undefined)) {
      return privateResponse({ ok: false, error: 'Plan, ownership, subscription, and access fields can only change through their verified workflows.' }, 400);
    }
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from('websites').select('id,status,access_status').eq('slug', slug).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return privateResponse({ ok: false, error: 'Website not found.' }, 404);
    const safe = {};
    ['status', 'business_name', 'admin_notes'].forEach((key) => {
      if (updates?.[key] !== undefined) safe[key] = updates[key];
    });
    if (safe.status && !['published', 'paused', 'draft', 'archived'].includes(safe.status)) {
      return privateResponse({ ok: false, error: 'Choose a supported website status.' }, 400);
    }
    if (safe.status === 'published' && String(existing.access_status || '').toLowerCase() !== 'active') {
      return privateResponse({ ok: false, error: 'Verified subscription access is required before this website can be reactivated.' }, 409);
    }
    if (typeof safe.business_name === 'string') safe.business_name = safe.business_name.slice(0, 200);
    if (typeof safe.admin_notes === 'string') safe.admin_notes = safe.admin_notes.slice(0, 2000);
    safe.updated_at = new Date().toISOString();

    const { error } = await supabase.from('websites').update(safe).eq('id', existing.id);
    if (error) throw error;
    await sendAdminNotification({ subject: `Admin updated: ${slug}`, event: 'Owner/admin website update', slug, details: `Changed: ${Object.keys(safe).filter(key => key !== 'updated_at').join(', ')}` });
    return privateResponse({ ok: true });
  } catch (e) {
    console.error('[admin-update] update failed', { message: e?.message || String(e) });
    return privateResponse({ ok: false, error: 'The website record could not be updated.' }, 500);
  }
}
