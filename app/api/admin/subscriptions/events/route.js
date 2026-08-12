import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getVerifiedAdmin } from '../../../../../lib/siteOwnerAuth';
import { reconcileGumroadEvent, reviewGumroadEvent } from '../../../../../lib/gumroadSubscriptionService.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function response(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(request) {
  try {
    const admin = await getVerifiedAdmin(request);
    if (!admin.ok) return response({ ok: false, error: admin.error }, admin.status);
    const { eventId, action, note } = await request.json();
    if (!eventId) return response({ ok: false, error: 'Choose an event.' }, 400);
    const supabase = getSupabaseAdmin();
    const result = action === 'recheck' || action === 'reconcile'
      ? await reconcileGumroadEvent({
          supabase,
          eventId,
          apply: action === 'reconcile',
          accessToken: process.env.GUMROAD_ACCESS_TOKEN,
          adminId: admin.user.id
        })
      : await reviewGumroadEvent({ supabase, eventId, action, note, adminId: admin.user.id });
    return response(result, result.status || 200);
  } catch (error) {
    const code = String(error?.code || 'event_review_failed').slice(0, 100);
    console.error('[admin-subscription-event] review failed', { code });
    return response({ ok: false, error: 'The event review could not be completed.' }, 500);
  }
}
