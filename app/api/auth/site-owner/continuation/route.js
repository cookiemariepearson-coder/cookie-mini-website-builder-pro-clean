import { NextResponse } from 'next/server';
import { getVerifiedSiteOwner } from '../../../../../lib/siteOwnerAuth';
import { checkoutContinuationKey, validCheckoutContinuation } from '../../../../../lib/checkoutContinuation.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const owner = await getVerifiedSiteOwner(request);
    if (!owner.ok) return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });

    const emailHash = checkoutContinuationKey(owner.email);
    const { data, error } = await owner.supabase
      .from('checkout_continuations')
      .select('return_path, expires_at')
      .eq('email_hash', emailHash)
      .maybeSingle();
    if (error) throw error;

    const returnPath = validCheckoutContinuation(data || {});
    if (data) await owner.supabase.from('checkout_continuations').delete().eq('email_hash', emailHash);
    return NextResponse.json({ ok: true, returnPath });
  } catch (error) {
    console.error('[checkout-continuation] recovery failed', { message: error?.message || String(error) });
    return NextResponse.json({ ok: false, returnPath: '/customer', error: 'Your sign-in succeeded, but checkout could not resume automatically. Open your saved draft to continue.' }, { status: 500 });
  }
}
