import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner } from '../../../../../lib/siteOwnerAuth';
import { checkoutIntentBuilderPath, checkoutIntentEmailHash, websiteCheckoutIntentState } from '../../../../../lib/websiteCheckoutIntent.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
    const emailHash = checkoutIntentEmailHash(owner.email);
    const { data, error } = await owner.supabase
      .from('website_checkout_intents')
      .select('*')
      .or(`owner_id.eq.${owner.user.id},email_hash.eq.${emailHash}`)
      .in('status', ['pending_auth', 'ready'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : null;
    const state = websiteCheckoutIntentState(row || {});
    if (!state.ok) return NextResponse.json({ ok: true, intent: null });
    return NextResponse.json({ ok: true, intent: { id: state.id, plan: state.plan, draftSlug: state.draftSlug, builderPath: checkoutIntentBuilderPath(row, { resume: true }) } });
  } catch (error) {
    console.error('[website-checkout-intent] active lookup failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: 'Pending purchases could not be checked right now.' }, { status: 500 });
  }
}
