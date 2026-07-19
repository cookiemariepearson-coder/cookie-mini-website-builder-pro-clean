import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const allowed = new Set(['active','unverified','canceled','ended','refunded','disputed','paused']);

export async function POST(req) {
  try {
    const { pin, slug, updates } = await req.json();
    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ ok:false, error:'Invalid admin PIN.' }, { status:401 });
    }
    if (!slug) return NextResponse.json({ ok:false, error:'Missing website slug.' }, { status:400 });
    const safe = {};
    if (updates?.subscription_status && allowed.has(updates.subscription_status)) safe.subscription_status = updates.subscription_status;
    if (updates?.access_status && ['active','paused','archived'].includes(updates.access_status)) safe.access_status = updates.access_status;
    if (updates?.status && ['published','paused','draft','archived'].includes(updates.status)) safe.status = updates.status;
    if (typeof updates?.paused_reason === 'string') safe.paused_reason = updates.paused_reason.slice(0, 500);
    if (typeof updates?.admin_notes === 'string') safe.admin_notes = updates.admin_notes.slice(0, 2000);
    if (updates?.plan && ['free','starter','business','premium'].includes(updates.plan)) safe.plan = updates.plan;
    if (Number.isFinite(Number(updates?.extra_pages))) safe.extra_pages = Number(updates.extra_pages);
    safe.updated_at = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('websites').update(safe).eq('slug', slug);
    if (error) throw error;
    return NextResponse.json({ ok:true });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  }
}
