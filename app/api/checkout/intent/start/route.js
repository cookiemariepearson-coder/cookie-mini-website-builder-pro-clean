import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { newWebsiteCheckoutIntent } from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'website-checkout-intent-start', limit: 30, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait a moment before starting another checkout.');
    const body = await request.json();
    const intent = newWebsiteCheckoutIntent({ plan: body.plan, draftSlug: body.draftSlug });
    if (!intent) return NextResponse.json({ ok: false, error: 'Choose Starter Pro, Business, Premium, or the Extra Page Add-On.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('website_checkout_intents').insert(intent);
    if (error) throw error;
    return NextResponse.json({ ok: true, intentId: intent.id, plan: intent.plan, expiresAt: intent.expires_at });
  } catch (error) {
    console.error('[website-checkout-intent] start failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'The secure checkout could not start. Your draft is still safe. Please try again shortly.' }, { status: 500 });
  }
}
