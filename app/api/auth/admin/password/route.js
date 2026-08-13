import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { safeAdminReturnPath, ownerPasswordRecoveryUrl } from '../../../../../lib/adminAuth.mjs';
import { canonicalBuilderOrigin } from '../../../../../lib/builderCheckoutAuth.mjs';
import { siteOwnerAccountExists } from '../../../../../lib/customerAuthUtils.mjs';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { sendResendEmail } from '../../../../../lib/resendEmail.mjs';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  isAllowedAdminEmail,
  ownerEmail
} from '../../../../../lib/siteOwnerAuth';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GENERIC_SIGN_IN_ERROR = 'The email or password was not accepted.';
const GENERIC_RESET_MESSAGE = 'If this email belongs to the owner account, a password recovery link will arrive shortly.';

function privateResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }
  });
}

function validEmail(value = '') {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim().toLowerCase());
}

function escapeHtml(value = '') {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function revokeToken(supabase, token = '') {
  if (!token) return;
  try { await supabase.auth.admin.signOut(token, 'local'); } catch {}
}

async function passwordSignIn(request, { email, password, returnPath, captchaToken }) {
  const ipLimited = rateLimit(request, { name: 'admin-password-signin-ip', limit: 10, windowMs: 15 * 60 * 1000 });
  const accountLimited = rateLimit(request, { name: 'admin-password-signin-account', limit: 6, windowMs: 15 * 60 * 1000, subject: email || 'invalid' });
  if (!ipLimited.ok || !accountLimited.ok) {
    return rateLimitResponse(!ipLimited.ok ? ipLimited : accountLimited, 'Too many sign-in attempts. Please wait before trying again.');
  }
  if (!validEmail(email) || !password) return privateResponse({ ok: false, error: GENERIC_SIGN_IN_ERROR }, 401);

  const supabase = getSupabaseAdmin();
  const credentials = captchaToken
    ? { email, password, options: { captchaToken } }
    : { email, password };
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  const accessToken = data?.session?.access_token || '';
  if (error || !accessToken || !data?.user?.id) {
    console.info('[owner-password-auth]', { event: 'OWNER_PASSWORD_SIGN_IN_REJECTED' });
    return privateResponse({ ok: false, error: GENERIC_SIGN_IN_ERROR }, 401);
  }

  const verified = await supabase.auth.getUser(accessToken);
  const verifiedEmail = ownerEmail(verified.data?.user);
  if (verified.error || !verified.data?.user?.id || !isAllowedAdminEmail(verifiedEmail)) {
    await revokeToken(supabase, accessToken);
    console.info('[owner-password-auth]', { event: 'OWNER_PASSWORD_SIGN_IN_REJECTED' });
    return privateResponse({ ok: false, error: GENERIC_SIGN_IN_ERROR }, 401);
  }

  const response = privateResponse({ ok: true, signedIn: true, returnPath: safeAdminReturnPath(returnPath) });
  response.cookies.set(ADMIN_SESSION_COOKIE, accessToken, adminSessionCookieOptions(data.session.expires_in));
  console.info('[owner-password-auth]', { event: 'OWNER_PASSWORD_SIGN_IN_SUCCEEDED' });
  return response;
}

async function passwordReset(request, { email, returnPath }) {
  const ipLimited = rateLimit(request, { name: 'admin-password-reset-ip', limit: 6, windowMs: 15 * 60 * 1000 });
  const accountLimited = rateLimit(request, { name: 'admin-password-reset-account', limit: 3, windowMs: 15 * 60 * 1000, subject: email || 'invalid' });
  if (!ipLimited.ok || !accountLimited.ok) {
    return rateLimitResponse(!ipLimited.ok ? ipLimited : accountLimited, 'Please wait before requesting another password recovery email.');
  }

  const accepted = privateResponse({ ok: true, pendingReset: true, message: GENERIC_RESET_MESSAGE });
  if (!validEmail(email) || !isAllowedAdminEmail(email)) return accepted;

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
    if (!apiKey || !from) throw new Error('Owner recovery email is not configured.');

    const supabase = getSupabaseAdmin();
    if (!await siteOwnerAccountExists(supabase, email)) return accepted;

    const requestUrl = new URL(request.url);
    const rootDomain = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').trim().toLowerCase();
    const origin = canonicalBuilderOrigin(requestUrl, rootDomain);
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({ type: 'recovery', email });
    if (linkError) throw linkError;
    const recoveryLink = ownerPasswordRecoveryUrl({
      origin,
      returnPath,
      tokenHash: linkData?.properties?.hashed_token,
      type: linkData?.properties?.verification_type || 'recovery'
    });
    if (!recoveryLink) throw new Error('Owner password recovery link could not be generated.');

    const requestId = randomUUID();
    await sendResendEmail({
      apiKey,
      from,
      to: email,
      replyTo: process.env.ADMIN_NOTIFICATION_EMAIL || undefined,
      notification: 'owner-password-recovery',
      requestId,
      idempotencyKey: `owner-password-recovery-${requestId}`,
      subject: 'Set or reset your Mini Website Builder owner password',
      html: `<h2>Set or reset your owner password</h2><p>Use the secure button below to choose a password for the Mini Website Builder owner dashboard.</p><p><a href="${escapeHtml(recoveryLink)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Set or Reset Owner Password</a></p><p>This one-time recovery link expires and cannot be reused.</p><p>Support: hello@cookiesdigitalcreations.com.</p>`
    });
    console.info('[owner-password-auth]', { event: 'OWNER_PASSWORD_RESET_REQUEST_ACCEPTED' });
  } catch {
    console.error('[owner-password-auth]', { event: 'OWNER_PASSWORD_RECOVERY_REQUEST_FAILED' });
  }
  return accepted;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim().toLowerCase();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const returnPath = safeAdminReturnPath(body.returnPath);
    const captchaToken = String(body.captchaToken || '').trim().slice(0, 4096);

    if (body.companyWebsite) {
      return action === 'reset'
        ? privateResponse({ ok: true, pendingReset: true, message: GENERIC_RESET_MESSAGE })
        : privateResponse({ ok: false, error: GENERIC_SIGN_IN_ERROR }, 401);
    }
    if (action === 'signin') return passwordSignIn(request, { email, password, returnPath, captchaToken });
    if (action === 'reset') return passwordReset(request, { email, returnPath });
    return privateResponse({ ok: false, error: GENERIC_SIGN_IN_ERROR }, 400);
  } catch {
    console.error('[owner-password-auth]', { event: 'OWNER_PASSWORD_REQUEST_FAILED' });
    return privateResponse({ ok: false, error: 'Owner access is temporarily unavailable. Please try again shortly.' }, 500);
  }
}
