import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { safeCustomerReturnPath } from '../lib/commerceConfig.mjs';

async function source(path) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }

test('returning customers authenticate with Supabase password sign-in without a routine email link', async () => {
  const route = await source('app/api/auth/site-owner/password/route.js');
  assert.match(route, /auth\.signInWithPassword\(\{ email, password \}\)/);
  assert.doesNotMatch(route.slice(route.indexOf("action === 'signin'"), route.indexOf("action === 'signup'")), /sendResendEmail|generateLink/);
});

test('new accounts use Supabase signup and one branded confirmation email', async () => {
  const route = await source('app/api/auth/site-owner/password/route.js');
  assert.match(route, /type: 'signup'/);
  assert.match(route, /password,/);
  assert.match(route, /display_name: displayName/);
  assert.match(route, /Confirm your Mini Website Builder account/);
  assert.doesNotMatch(route, /signInWithOtp/);
});

test('passwords meet the 10 character floor and are not logged, emailed or placed in a URL', async () => {
  const route = await source('app/api/auth/site-owner/password/route.js');
  assert.match(route, /MIN_PASSWORD_LENGTH = 10/);
  assert.doesNotMatch(route, /console\.[a-z]+\([^\n]*(\{\s*password\s*\}|password\s*:)/i);
  assert.doesNotMatch(route, /searchParams\.set\(['"]password|new URLSearchParams\([^\n]*password/i);
  assert.match(route, /Your password is never included in email/);
});

test('password auth issues a secure HttpOnly same-site session cookie', async () => {
  const [route, auth] = await Promise.all([source('app/api/auth/site-owner/password/route.js'), source('lib/siteOwnerAuth.js')]);
  assert.match(route, /response\.cookies\.set\(SITE_OWNER_SESSION_COOKIE/);
  assert.match(auth, /httpOnly: true/);
  assert.match(auth, /sameSite: 'lax'/);
  assert.match(auth, /secure: process\.env\.NODE_ENV === 'production'/);
});

test('legacy browser tokens are adopted once and then removed from local storage', async () => {
  const [provider, session] = await Promise.all([source('components/AccountModalProvider.js'), source('app/api/auth/site-owner/session/route.js')]);
  assert.match(provider, /LEGACY_AUTH_TOKEN_KEY/);
  assert.match(provider, /localStorage\.removeItem\(LEGACY_AUTH_TOKEN_KEY\)/);
  assert.match(session, /owner\.migratedBearer/);
  assert.match(session, /response\.cookies\.set/);
});

test('wrong and unknown password responses are privacy safe', async () => {
  const route = await source('app/api/auth/site-owner/password/route.js');
  assert.match(route, /The email or password was not accepted/);
  assert.match(route, /PASSWORD_RESET_REQUEST_ACCEPTED_PRIVACY_PROTECTED/);
  assert.match(route, /If this email belongs to a Mini Website Builder account/);
});

test('sign-in, signup and reset attempts have IP and account rate limits plus a honeypot', async () => {
  const route = await source('app/api/auth/site-owner/password/route.js');
  assert.match(route, /customer-password-\$\{action\}-ip/);
  assert.match(route, /customer-password-\$\{action\}-account/);
  assert.match(route, /body\.companyWebsite/);
});

test('existing passwordless customers reset the same Supabase user instead of creating a duplicate', async () => {
  const [request, update] = await Promise.all([source('app/api/auth/site-owner/password/route.js'), source('app/api/auth/site-owner/password/update/route.js')]);
  assert.match(request, /type: 'recovery'/);
  assert.match(update, /auth\.verifyOtp/);
  assert.match(update, /updateUserById\(data\.user\.id, \{ password \}\)/);
  assert.doesNotMatch(update, /createUser|insert\(/);
  assert.doesNotMatch(update, /\.cookies\.set\(/);
});

test('password recovery strips the secret fragment before submission and rejects replayed links', async () => {
  const [page, update] = await Promise.all([source('app/customer/auth/password/page.js'), source('app/api/auth/site-owner/password/update/route.js')]);
  assert.match(page, /window\.history\.replaceState/);
  assert.match(page, /mode', 'signin'/);
  assert.match(page, /signIn\.searchParams\.set\('return', result\.returnPath\)/);
  assert.match(update, /invalid, expired, or already used/);
  assert.match(update, /type !== 'recovery'/);
});

test('account returns accept only validated Builder-owned destinations', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.equal(safeCustomerReturnPath(`/checkout/continue?intent=${id}&draft=cookies-kitchen`), `/checkout/continue?intent=${id}&draft=cookies-kitchen`);
  assert.equal(safeCustomerReturnPath('https://connect.cookiesdigitalcreations.com/customer'), '/customer');
  assert.equal(safeCustomerReturnPath('/checkout/continue?intent=forged'), '/customer');
});

test('customer website search derives identity from the verified server session only', async () => {
  const [route, session] = await Promise.all([source('app/api/site/search/route.js'), source('app/api/auth/site-owner/session/route.js')]);
  assert.match(route, /const email = owner\.email/);
  assert.match(route, /\.eq\('owner_id', owner\.user\.id\)/);
  assert.doesNotMatch(route, /body\.email/);
  assert.match(route, /private, no-store, max-age=0/);
  assert.match(session, /private, no-store, max-age=0/g);
});

test('My Websites searches owned names, slugs, plans and statuses without an email field', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /Search my websites/);
  assert.match(page, /matchesWords\(site\.plan\)/);
  assert.match(page, /matchesWords\(status\)/);
  assert.doesNotMatch(page, /id="customer-auth-email"/);
});

test('owner website and request searches remain admin-authorized and bounded', async () => {
  const [list, requests, requestPage] = await Promise.all([source('app/api/admin/list/route.js'), source('app/api/admin/customer-requests/route.js'), source('app/admin/requests/page.js')]);
  assert.match(list, /getVerifiedAdmin/);
  assert.match(list, /\.limit\(250\)/);
  assert.match(requests, /getVerifiedAdmin/);
  assert.match(requests, /\.limit\(250\)/);
  for (const field of ['request_id', 'customer_email', 'customer_name', 'business_name']) assert.match(requestPage, new RegExp(`item\\.${field}`));
});

test('Builder removes duplicate create/sign-in button blocks while keeping contextual protection', async () => {
  const builder = await source('app/builder/page.js');
  assert.doesNotMatch(builder, /href="\/customer\?mode=create/);
  assert.doesNotMatch(builder, /href="\/customer\?mode=signin/);
  assert.match(builder, /openAccountModal/);
  assert.match(builder, /Saved on this device\. Sign in or create an account/);
});

test('DFY confirmations use the approved compact copy, close control and 8.5 second dismissal', async () => {
  const page = await source('app/done-for-you/request/page.js');
  assert.match(page, /Request received\. Opening secure checkout…/);
  assert.match(page, /Request received\. We’ll email you the next step\./);
  assert.match(page, /8500/);
  assert.match(page, /Dismiss request confirmation/);
  assert.match(page, /setForm\(\{ name: '', business: ''/);
});

test('paid checkout preserves its server intent while using the password account modal', async () => {
  const page = await source('app/checkout/continue/page.js');
  assert.match(page, /\/api\/checkout\/intent\/status/);
  assert.match(page, /\/api\/checkout\/intent\/resume/);
  assert.match(page, /openAccountModal/);
  assert.match(page, /Sign In and Continue Purchase/);
  assert.doesNotMatch(page, /Email My Secure Checkout Link/);
});

test('sign-out revokes the server session and clears both cookie and legacy token', async () => {
  const [route, provider] = await Promise.all([source('app/api/auth/site-owner/signout/route.js'), source('components/AccountModalProvider.js')]);
  assert.match(route, /admin\.signOut/);
  assert.match(route, /maxAge: 0/);
  assert.match(provider, /localStorage\.removeItem\(LEGACY_AUTH_TOKEN_KEY\)/);
});

test('the 56-test AI Video protection suite remains structurally separate from account UI', async () => {
  const modal = await source('components/AccountModalProvider.js');
  assert.doesNotMatch(modal, /videoAccessToken|HeyGen|licenseKey|video_usage/);
});
