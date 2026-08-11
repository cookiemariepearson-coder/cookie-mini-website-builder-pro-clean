import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { rateLimit, rateLimitResponse } from '../../../../../lib/rateLimit.mjs';
import { safeCustomerReturnPath } from '../../../../../lib/commerceConfig.mjs';
import { builderCustomerConfirmationUrl, canonicalBuilderOrigin } from '../../../../../lib/builderCheckoutAuth.mjs';
import { siteOwnerAccountExists } from '../../../../../lib/customerAuthUtils.mjs';
import { sendResendEmail } from '../../../../../lib/resendEmail.mjs';
import { SITE_OWNER_SESSION_COOKIE, siteOwnerSessionCookieOptions } from '../../../../../lib/siteOwnerAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 10;

function escapeHtml(value = '') {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function validEmail(value = '') {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim().toLowerCase());
}

function authResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }
  });
}

function passwordPolicyError(password = '') {
  return String(password || '').length < MIN_PASSWORD_LENGTH
    ? `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`
    : '';
}

function recoveryUrl({ origin, returnPath, tokenHash, type }) {
  if (!tokenHash || type !== 'recovery') return '';
  const url = new URL('/customer/auth/password', origin);
  url.searchParams.set('return', safeCustomerReturnPath(returnPath));
  url.hash = new URLSearchParams({ token_hash: tokenHash, type }).toString();
  return url.toString();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim().toLowerCase();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const displayName = String(body.displayName || '').replace(/[<>]/g, '').trim().slice(0, 100);
    const returnPath = safeCustomerReturnPath(body.returnPath);

    if (body.companyWebsite) return authResponse({ ok: true, pendingConfirmation: action !== 'signin' });
    if (!['signin', 'signup', 'reset'].includes(action) || !validEmail(email)) {
      return authResponse({ ok: false, error: 'Enter a valid email address and choose an account action.' }, 400);
    }

    const ipLimit = rateLimit(request, { name: `customer-password-${action}-ip`, limit: action === 'signin' ? 12 : 6, windowMs: 15 * 60 * 1000 });
    const accountLimit = rateLimit(request, { name: `customer-password-${action}-account`, limit: action === 'signin' ? 8 : 4, windowMs: 15 * 60 * 1000, subject: email });
    if (!ipLimit.ok || !accountLimit.ok) return rateLimitResponse(!ipLimit.ok ? ipLimit : accountLimit, 'Please wait before trying again. Your account and websites remain safe.');

    const supabase = getSupabaseAdmin();
    if (action === 'signin') {
      if (!password) return authResponse({ ok: false, error: 'Enter your password.' }, 400);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.session?.access_token || !data?.user?.id) {
        console.info('[builder-password-auth]', { event: 'PASSWORD_SIGN_IN_REJECTED' });
        return authResponse({ ok: false, error: 'The email or password was not accepted. Try again or set/reset your password.' }, 401);
      }
      const response = authResponse({ ok: true, signedIn: true, returnPath, email: data.user.email || '' });
      response.cookies.set(SITE_OWNER_SESSION_COOKIE, data.session.access_token, siteOwnerSessionCookieOptions(data.session.expires_in));
      console.info('[builder-password-auth]', { event: 'PASSWORD_SIGN_IN_SUCCEEDED' });
      return response;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_NOTIFICATION_FROM_EMAIL;
    if (!apiKey || !from) return authResponse({ ok: false, error: 'Account email is temporarily unavailable. Please try again shortly.' }, 503);
    const requestUrl = new URL(request.url);
    const rootDomain = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').trim().toLowerCase();
    const origin = canonicalBuilderOrigin(requestUrl, rootDomain);
    const accountExists = await siteOwnerAccountExists(supabase, email);

    if (action === 'signup') {
      const policyError = passwordPolicyError(password);
      if (!displayName) return authResponse({ ok: false, error: 'Enter the name you want displayed on your account.' }, 400);
      if (policyError) return authResponse({ ok: false, error: policyError }, 400);
      if (!accountExists) {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email,
          password,
          options: { data: { display_name: displayName } }
        });
        if (linkError) throw linkError;
        const confirmationUrl = builderCustomerConfirmationUrl({
          origin,
          returnPath,
          tokenHash: linkData?.properties?.hashed_token,
          type: linkData?.properties?.verification_type || 'signup',
          authMode: 'create'
        });
        if (!confirmationUrl) throw new Error('Builder account confirmation link could not be generated.');
        await sendResendEmail({
          apiKey,
          from,
          to: email,
          replyTo: process.env.ADMIN_NOTIFICATION_EMAIL || undefined,
          notification: 'builder-password-signup',
          requestId: `signup-${Date.now().toString(36)}`,
          idempotencyKey: `builder-password-signup-${Date.now().toString(36)}`,
          subject: 'Confirm your Mini Website Builder account',
          html: `<h2>Confirm your free Mini Website Builder account</h2><p>Hello ${escapeHtml(displayName)}. Confirm your email once to save websites permanently and open them on another device.</p><p><a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Confirm Email and Continue</a></p><p>This one-time link is temporary. Your password is never included in email.</p><p>Support: hello@cookiesdigitalcreations.com.</p>`
        });
      }
      console.info('[builder-password-auth]', { event: 'SIGNUP_REQUEST_ACCEPTED_PRIVACY_PROTECTED' });
      return authResponse({ ok: true, pendingConfirmation: true, message: 'Check your email to confirm your account. If you already have an account, use Set or reset password.' });
    }

    if (accountExists) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({ type: 'recovery', email });
      if (linkError) throw linkError;
      const url = recoveryUrl({ origin, returnPath, tokenHash: linkData?.properties?.hashed_token, type: linkData?.properties?.verification_type || 'recovery' });
      if (!url) throw new Error('Builder password recovery link could not be generated.');
      await sendResendEmail({
        apiKey,
        from,
        to: email,
        replyTo: process.env.ADMIN_NOTIFICATION_EMAIL || undefined,
        notification: 'builder-password-recovery',
        requestId: `recovery-${Date.now().toString(36)}`,
        idempotencyKey: `builder-password-recovery-${Date.now().toString(36)}`,
        subject: 'Set or reset your Mini Website Builder password',
        html: `<h2>Set or reset your Mini Website Builder password</h2><p>Use the secure button below to choose a password for your existing account. Your websites, purchases, and user ID stay unchanged.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 20px;background:#f28a1e;color:#20172f;text-decoration:none;border-radius:999px;font-weight:800">Set or Reset Password</a></p><p>This one-time recovery link expires and cannot be reused.</p><p>Support: hello@cookiesdigitalcreations.com.</p>`
      });
    }
    console.info('[builder-password-auth]', { event: 'PASSWORD_RESET_REQUEST_ACCEPTED_PRIVACY_PROTECTED' });
    return authResponse({ ok: true, pendingReset: true, message: 'If this email belongs to a Mini Website Builder account, a password link will arrive shortly.' });
  } catch (error) {
    console.error('[builder-password-auth] request failed', { message: error?.message || String(error) });
    return authResponse({ ok: false, error: 'Account access is temporarily unavailable. Please try again shortly.' }, 500);
  }
}
