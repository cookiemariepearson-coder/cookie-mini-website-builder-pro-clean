import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedAdmin } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
    const { slug, updates } = await request.json();
    if (!slug) return NextResponse.json({ ok: false, error: 'Missing website slug.' }, { status: 400 });
    if (typeof updates?.admin_notes !== 'string') {
      return NextResponse.json({ ok: false, error: 'Subscription access can only change from verified Gumroad evidence.' }, { status: 400 });
    }
    const safe = { admin_notes: updates.admin_notes.slice(0, 2000), updated_at: new Date().toISOString() };
    const { error } = await getSupabaseAdmin().from('websites').update(safe).eq('slug', slug);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin-subscriptions] note update failed', { code: String(error?.code || 'note_update_failed').slice(0, 100) });
    return NextResponse.json({ ok: false, error: 'The private note could not be updated.' }, { status: 500 });
  }
}
