import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedAdmin } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return privateResponse({ ok: false, error: admin.error }, admin.status);
    const { slug, updates } = await request.json();
    if (!slug) return privateResponse({ ok: false, error: 'Missing website slug.' }, 400);
    if (typeof updates?.admin_notes !== 'string') {
      return privateResponse({ ok: false, error: 'Subscription access can only change from verified Gumroad evidence.' }, 400);
    }
    const safe = { admin_notes: updates.admin_notes.slice(0, 2000), updated_at: new Date().toISOString() };
    const { error } = await getSupabaseAdmin().from('websites').update(safe).eq('slug', slug);
    if (error) throw error;
    return privateResponse({ ok: true });
  } catch (error) {
    console.error('[admin-subscriptions] note update failed', { code: String(error?.code || 'note_update_failed').slice(0, 100) });
    return privateResponse({ ok: false, error: 'The private note could not be updated.' }, 500);
  }
}
