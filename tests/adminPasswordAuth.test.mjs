import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import {
  CANONICAL_ADMIN_EMAIL,
  isCanonicalOwnerEmail,
  legacyOwnerEnvironmentSummary,
  normalizeOwnerEmail,
  ownerPasswordRecoveryUrl,
  safeAdminReturnPath
} from '../lib/adminAuth.mjs';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('owner return paths stay inside protected admin pages', () => {
  assert.equal(safeAdminReturnPath('/admin/subscriptions?view=unmatched'), '/admin/subscriptions?view=unmatched');
  assert.equal(safeAdminReturnPath('/admin'), '/admin');
  assert.equal(safeAdminReturnPath('https://evil.example/admin'), '/admin');
  assert.equal(safeAdminReturnPath('//evil.example/admin'), '/admin');
  assert.equal(safeAdminReturnPath('/customer'), '/admin');
  assert.equal(safeAdminReturnPath('/admin/auth/password'), '/admin');
});

test('owner recovery links use only the approved owner password route and keep the token in the fragment', () => {
  const tokenHash = 'token_hash_value_1234567890-ABCDEFG';
  const link = ownerPasswordRecoveryUrl({
    origin: 'https://www.cookiesdigitalcreations.com',
    returnPath: '/admin/subscriptions',
    tokenHash,
    type: 'recovery'
  });
  assert.equal(link, `https://www.cookiesdigitalcreations.com/admin/auth/password?return=%2Fadmin%2Fsubscriptions#token_hash=${tokenHash}&type=recovery`);
  assert.doesNotMatch(link.split('#')[0], /token_hash/);
  assert.equal(ownerPasswordRecoveryUrl({ origin: 'https://www.cookiesdigitalcreations.com', tokenHash, type: 'magiclink' }), '');
});

test('one canonical owner identity is enforced regardless of legacy environment entries', () => {
  assert.equal(CANONICAL_ADMIN_EMAIL, 'hello@cookiesdigitalcreations.com');
  assert.equal(normalizeOwnerEmail('  HELLO@CookiesDigitalCreations.com  '), CANONICAL_ADMIN_EMAIL);
  assert.equal(isCanonicalOwnerEmail(' HELLO@COOKIESDIGITALCREATIONS.COM '), true);
  assert.equal(isCanonicalOwnerEmail('former-owner@example.invalid'), false);

  const summary = legacyOwnerEnvironmentSummary({
    ADMIN_EMAILS: 'former-owner@example.invalid, HELLO@COOKIESDIGITALCREATIONS.COM ',
    ADMIN_EMAIL: 'another-owner@example.invalid'
  });
  assert.deepEqual(summary, {
    adminEmailsConfigured: true,
    adminEmailConfigured: true,
    legacyEntryCount: 3,
    legacyCanonicalEntryCount: 1,
    legacyNonCanonicalEntryCount: 2,
    effectiveOwnerCount: 1
  });
});

test('routine owner sign-in uses Supabase password verification, allowlist verification, and a dedicated secure cookie', async () => {
  const [route, auth] = await Promise.all([
    source('app/api/auth/admin/password/route.js'),
    source('lib/siteOwnerAuth.js')
  ]);
  assert.match(route, /auth\.signInWithPassword\(credentials\)/);
  assert.match(route, /auth\.getUser\(accessToken\)/);
  assert.match(route, /isAllowedAdminEmail\(verifiedEmail\)/);
  assert.match(route, /response\.cookies\.set\(ADMIN_SESSION_COOKIE/);
  assert.match(auth, /adminSessionCookieOptions/);
  assert.match(auth, /httpOnly: true/);
  assert.match(auth, /sameSite: 'lax'/);
  assert.match(auth, /secure: process\.env\.NODE_ENV === 'production'/);
  assert.match(auth, /isCanonicalOwnerEmail\(email\)/);
  assert.doesNotMatch(auth, /process\.env\.ADMIN_EMAILS|process\.env\.ADMIN_EMAIL/);
  assert.doesNotMatch(route, /signInWithOtp/);
});

test('malformed or expired owner cookies fail closed without dereferencing a missing user', async () => {
  const auth = await source('lib/siteOwnerAuth.js');
  assert.match(auth, /normalizeOwnerEmail\(user\?\.email\)/);
  assert.match(auth, /if \(error \|\| !data\?\.user \|\| !email\)/);
});

test('routine owner sign-in sends no email and returns privacy-safe errors', async () => {
  const route = await source('app/api/auth/admin/password/route.js');
  const signIn = route.slice(route.indexOf('async function passwordSignIn'), route.indexOf('async function passwordReset'));
  assert.doesNotMatch(signIn, /sendResendEmail|generateLink|resetPasswordForEmail/);
  assert.match(route, /GENERIC_SIGN_IN_ERROR = 'The email or password was not accepted\.'/);
  assert.match(signIn, /error: GENERIC_SIGN_IN_ERROR/);
  assert.doesNotMatch(signIn, /not authorized|allowlist|owner email/i);
  assert.doesNotMatch(route, /console\.[a-z]+\([^\n]*(\{\s*password\s*\}|password\s*:)/i);
  assert.doesNotMatch(route, /searchParams\.set\(['"]password|new URLSearchParams\([^\n]*password/i);
});

test('owner password attempts have server-side IP and account rate limits with CAPTCHA passthrough', async () => {
  const route = await source('app/api/auth/admin/password/route.js');
  for (const limiter of [
    'admin-password-signin-ip',
    'admin-password-signin-account',
    'admin-password-reset-ip',
    'admin-password-reset-account'
  ]) assert.match(route, new RegExp(limiter));
  assert.match(route, /Too many sign-in attempts/);
  assert.match(route, /options: \{ captchaToken \}/);
  assert.match(route, /body\.companyWebsite/);
});

test('owner recovery is non-enumerating, allowlisted, one-time, and returns to owner sign-in', async () => {
  const [request, update, page] = await Promise.all([
    source('app/api/auth/admin/password/route.js'),
    source('app/api/auth/admin/password/update/route.js'),
    source('app/admin/auth/password/page.js')
  ]);
  assert.match(request, /type: 'recovery'/);
  assert.match(request, /ownerPasswordRecoveryUrl/);
  assert.match(request, /If this email belongs to the owner account/);
  assert.match(request, /isAllowedAdminEmail\(email\)/);
  assert.match(update, /auth\.verifyOtp\(\{ token_hash: tokenHash, type: 'recovery' \}\)/);
  assert.match(update, /isAllowedAdminEmail\(email\)/);
  assert.match(update, /updateUserById\(data\.user\.id, \{ password \}\)/);
  assert.match(update, /invalid, expired, already used, or unauthorized/);
  assert.match(update, /revokeRecoverySession/);
  assert.doesNotMatch(update, /cookies\.set|createUser|insert\(/);
  assert.match(page, /window\.history\.replaceState/);
  assert.match(page, /Return to Owner Sign-In/);
});

test('owner sign-in UI is accessible, password-only, and shared by every admin page', async () => {
  const [panel, admin, subscriptions, requests, videoCredits] = await Promise.all([
    source('components/OwnerSignInPanel.js'),
    source('app/admin/page.js'),
    source('app/admin/subscriptions/page.js'),
    source('app/admin/requests/page.js'),
    source('app/admin/video-credits/page.js')
  ]);
  for (const label of ['Owner email', 'Password', 'Show Password', 'Sign In', 'Set or Reset Password', 'Return to Main Website']) {
    assert.match(panel, new RegExp(label));
  }
  assert.match(panel, /autoComplete="username"/);
  assert.match(panel, /autoComplete="current-password"/);
  assert.match(panel, /aria-live="polite"/);
  assert.match(panel, /statusRef\.current\?\.focus/);
  assert.doesNotMatch(panel, /Create Owner Account|registration|magic.?link|Email My Secure Owner Link/i);
  for (const [page, returnPath] of [
    [admin, '/admin'],
    [subscriptions, '/admin/subscriptions'],
    [requests, '/admin/requests'],
    [videoCredits, '/admin/video-credits']
  ]) {
    assert.match(page, /OwnerSignInPanel/);
    assert.match(page, new RegExp(`returnPath="${returnPath.replaceAll('/', '\\/')}"`));
    assert.doesNotMatch(page, /Email Secure Sign-In Link|requestOwnerLink|\/api\/auth\/admin\/request/);
  }
});

test('retired routine owner-link endpoint and callback are removed while customer email flows remain', async () => {
  await assert.rejects(access(new URL('../app/api/auth/admin/request/route.js', import.meta.url)));
  await assert.rejects(access(new URL('../app/admin/auth/callback/page.js', import.meta.url)));
  const customerRecovery = await source('app/api/auth/site-owner/password/route.js');
  assert.match(customerRecovery, /builder-password-recovery/);
  assert.match(customerRecovery, /builder-password-signup/);
});

test('owner lock revokes the owner Supabase session, clears only its cookie, and stays private', async () => {
  const [session, customerSignout] = await Promise.all([
    source('app/api/auth/admin/session/route.js'),
    source('app/api/auth/site-owner/signout/route.js')
  ]);
  assert.match(session, /request\.cookies\.get\(ADMIN_SESSION_COOKIE\)/);
  assert.match(session, /auth\.admin\.signOut\(token, 'local'\)/);
  assert.match(session, /response\.cookies\.set\(ADMIN_SESSION_COOKIE/);
  assert.match(session, /maxAge: 0/);
  assert.match(session, /private, no-store, max-age=0/);
  assert.doesNotMatch(session, /SITE_OWNER_SESSION_COOKIE/);
  assert.match(customerSignout, /SITE_OWNER_SESSION_COOKIE/);
  assert.doesNotMatch(customerSignout, /ADMIN_SESSION_COOKIE/);
});
