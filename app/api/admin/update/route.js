import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { sendAdminNotification } from '../../../../lib/adminNotifications';
import { getVerifiedAdmin } from '../../../../lib/siteOwnerAuth';

export async function POST(req) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
    const { slug, updates } = await req.json();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Missing website slug' }, { status: 400 });
    }

    const safe = {};
    ['status', 'plan', 'extra_pages', 'monthly_price', 'customer_email', 'business_name', 'admin_notes'].forEach((key) => {
      if (updates?.[key] !== undefined) safe[key] = updates[key];
    });
    safe.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('websites').update(safe).eq('slug', slug);
    if (error) throw error;
    await sendAdminNotification({ subject: `Admin updated: ${slug}`, event: 'Owner/admin website update', slug, details: `Changed: ${Object.keys(updates || {}).join(', ')}` });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin-update] update failed', { message: e?.message || String(e) });
    return NextResponse.json({ ok: false, error: 'The website record could not be updated.' }, { status: 500 });
  }
}
