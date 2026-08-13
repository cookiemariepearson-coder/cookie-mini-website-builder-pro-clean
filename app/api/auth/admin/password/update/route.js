import { NextResponse } from 'next/server';
import { safeAdminReturnPath } from '../../../../../../lib/adminAuth.mjs';
import { normalizeBuilderCheckoutAuthToken, normalizeBuilderCheckoutAuthType } from '../../../../../../lib/builderCheckoutAuth.mjs';
import { rateLimit, rateLimitResponse } from '../../../../../../lib/rateLimit.mjs';
import { isAllowedAdminEmail, ownerEmail } from '../../../../../../lib/siteOwnerAuth';
import { getSupabaseAdmin } from '../../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }
  });
}

async function revokeRecoverySession(supabase, token = '') {
  if (!token) return;
  try { await supabase.auth.admin.signOut(token, 'local'); } catch {}
}

export async function POST(request) {
  try {
    const limited = rateLimit(request, { name: 'admin-password-update-ip', limit: 6, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) return rateLimitResponse(limited, 'Please wait before trying this recovery link again.');

    const body = await request.json().catch(() => ({}));
    const tokenHash = normalizeBuilderCheckoutAuthToken(body.tokenHash);
    const type = normalizeBuilderCheckoutAuthType(body.type);
    const password = String(body.password || '');
    const returnPath = safeAdminReturnPath(body.returnPath);
    if (!tokenHash || type !== 'recovery') return privateResponse({ ok: false, error: 'This owner password link is incomplete or expired.' }, 400);
    if (password.length < 10) return privateResponse({ ok: false, error: 'Use at least 10 characters for your owner password.' }, 400);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    const recoveryToken = data?.session?.access_token || '';
    const email = ownerEmail(data?.user);
    if (error || !data?.user?.id || !isAllowedAdminEmail(email)) {
      await revokeRecoverySession(supabase, recoveryToken);
      return privateResponse({ ok: false, error: 'This owner password link is invalid, expired, already used, or unauthorized.' }, 401);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, { password });
    await revokeRecoverySession(supabase, recoveryToken);
    if (updateError) throw updateError;
    console.info('[owner-password-auth]', { event: 'OWNER_PASSWORD_RECOVERY_SUCCEEDED' });
    return privateResponse({ ok: true, returnPath, signInRequired: true });
  } catch {
    console.error('[owner-password-auth]', { event: 'OWNER_PASSWORD_RECOVERY_FAILED' });
    return privateResponse({ ok: false, error: 'Your owner password could not be updated right now. Request a new recovery link.' }, 500);
  }
}
