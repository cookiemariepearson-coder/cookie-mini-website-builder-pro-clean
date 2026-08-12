import { NextResponse } from 'next/server';
import { normalizeBuilderCheckoutAuthToken, normalizeBuilderCheckoutAuthType } from '../../../../../../lib/builderCheckoutAuth.mjs';
import { safeCustomerReturnPath } from '../../../../../../lib/commerceConfig.mjs';
import { getSupabaseAdmin } from '../../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../../lib/rateLimit.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function recoveryResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }
  });
}

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'customer-password-update', limit: 6, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before trying this recovery link again.');
    const body = await request.json().catch(() => ({}));
    const tokenHash = normalizeBuilderCheckoutAuthToken(body.tokenHash);
    const type = normalizeBuilderCheckoutAuthType(body.type);
    const password = String(body.password || '');
    const returnPath = safeCustomerReturnPath(body.returnPath);
    if (!tokenHash || type !== 'recovery') return recoveryResponse({ ok: false, error: 'This password link is incomplete or expired.' }, 400);
    if (password.length < 10) return recoveryResponse({ ok: false, error: 'Use at least 10 characters for your password.' }, 400);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (error || !data?.user?.id) return recoveryResponse({ ok: false, error: 'This password link is invalid, expired, or already used. Request a new link.' }, 401);
    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, { password });
    if (updateError) throw updateError;
    console.info('[builder-password-auth]', { event: 'PASSWORD_RECOVERY_SUCCEEDED' });
    return recoveryResponse({ ok: true, returnPath, signInRequired: true });
  } catch (error) {
    console.error('[builder-password-auth] recovery failed', { message: error?.message || String(error) });
    return recoveryResponse({ ok: false, error: 'Your password could not be updated right now. Request a new recovery link.' }, 500);
  }
}
