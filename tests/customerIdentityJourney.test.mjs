import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  guestDraftClaimSecretHash,
  guestDraftClaimSecretMatches,
  guestDraftClaimState,
  newGuestDraftClaimSecret
} from '../lib/guestDraftClaim.mjs';
import {
  builderCustomerConfirmationUrl,
  normalizeBuilderCustomerAuthMode
} from '../lib/builderCheckoutAuth.mjs';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('new-account and returning sign-in modes are explicit and safe by default', () => {
  assert.equal(normalizeBuilderCustomerAuthMode('create'), 'create');
  assert.equal(normalizeBuilderCustomerAuthMode('signin'), 'signin');
  assert.equal(normalizeBuilderCustomerAuthMode('anything-else'), 'signin');
});

test('Builder-owned confirmation URLs keep validated internal returns and auth mode', () => {
  const tokenHash = 'a'.repeat(48);
  const url = builderCustomerConfirmationUrl({ origin: 'https://www.cookiesdigitalcreations.com', returnPath: 'https://connect.cookiesdigitalcreations.com/', tokenHash, type: 'magiclink', authMode: 'create' });
  assert.match(url, /^https:\/\/www\.cookiesdigitalcreations\.com\/customer\/auth\/confirm\?/);
  assert.match(url, /return=%2Fcustomer/);
  assert.match(url, /mode=create/);
  assert.doesNotMatch(url, /connect\.cookiesdigitalcreations/);
});

test('guest claim secrets are high entropy, hashed, and compared without storing plaintext', () => {
  const secret = newGuestDraftClaimSecret();
  const hash = guestDraftClaimSecretHash(secret);
  assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(guestDraftClaimSecretMatches(secret, hash), true);
  assert.equal(guestDraftClaimSecretMatches(newGuestDraftClaimSecret(), hash), false);
});

test('expired, claimed, and pending guest-claim states are distinct', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.equal(guestDraftClaimState({ id, status: 'pending', expires_at: '2036-01-02T00:00:00Z' }, Date.parse('2036-01-01T00:00:00Z')).ok, true);
  assert.equal(guestDraftClaimState({ id, status: 'pending', expires_at: '2035-12-31T00:00:00Z' }, Date.parse('2036-01-01T00:00:00Z')).reason, 'expired');
  assert.equal(guestDraftClaimState({ id, status: 'claimed', expires_at: '2036-01-02T00:00:00Z' }, Date.parse('2036-01-01T00:00:00Z')).reason, 'claimed');
});

test('returning Sign In never creates an unknown Supabase account', async () => {
  const request = await source('app/api/auth/site-owner/request/route.js');
  assert.match(request, /siteOwnerAccountExists\(supabase, email\)/);
  assert.match(request, /authMode === 'signin' && !accountExists/);
  assert.match(request, /AUTH_REQUEST_ACCEPTED_PRIVACY_PROTECTED/);
  assert.match(request, /If this email belongs to a Mini Website Builder account/);
});

test('Create Free Account and Sign In use distinct branded email content', async () => {
  const request = await source('app/api/auth/site-owner/request/route.js');
  assert.match(request, /Create your Cookies Digital Creations website account/);
  assert.match(request, /Your secure Mini Website Builder sign-in link/);
  assert.match(request, /This one-time link is temporary/);
  assert.match(request, /hello@cookiesdigitalcreations\.com/);
  assert.doesNotMatch(request, /complete license|private website content/i);
});

test('guest drafts are local-first, versioned, recoverable, and honestly labeled', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /localDraftVersion: 1/);
  assert.match(builder, /updatedAt: new Date\(\)\.toISOString\(\)/);
  assert.match(builder, /Saved on this device/);
  assert.match(builder, /save permanently, purchase, or publish/);
  assert.match(builder, /We could not save this draft in your browser/);
  assert.match(builder, /cookieGuestDraftClaimV1/);
});

test('guest claim requires verified owner plus original opaque browser credential', async () => {
  const claim = await source('app/api/site/guest-draft/claim/route.js');
  assert.match(claim, /getVerifiedSiteOwner\(request\)/);
  assert.match(claim, /guestDraftClaimSecretMatches/);
  assert.match(claim, /\.eq\('status', 'pending'\)/);
  assert.match(claim, /siteBelongsToOwner/);
  assert.match(claim, /claimed_by: owner\.user\.id/);
  assert.doesNotMatch(claim, /body\.email|customer_email.*body/i);
});

test('guest claim transfer is idempotent and preserves a recovery copy until server success', async () => {
  const [claim, confirm] = await Promise.all([
    source('app/api/site/guest-draft/claim/route.js'),
    source('app/customer/auth/confirm/page.js')
  ]);
  assert.match(claim, /alreadyClaimed: true/);
  assert.match(claim, /status: 'claiming'/);
  assert.match(confirm, /if \(claimResult\.ok\)/);
  assert.match(confirm, /localStorage\.removeItem\(GUEST_CLAIM_KEY\)/);
  assert.doesNotMatch(confirm, /removeItem\('cookieDraftSite'\)/);
});

test('expired guest claim credentials are replaced without blocking account access', async () => {
  const modal = await source('components/AccountModalProvider.js');
  assert.match(modal, /response\.status === 410/);
  assert.match(modal, /localStorage\.removeItem\(GUEST_CLAIM_KEY\)/);
  assert.match(modal, /return prepareGuestDraftClaim\(\)/);
});

test('a safely verified legacy owner can receive owner_id during guest transfer', async () => {
  const claim = await source('app/api/site/guest-draft/claim/route.js');
  assert.match(claim, /siteBelongsToOwner\(existing, owner\)/);
  assert.match(claim, /owner_id: owner\.user\.id/);
  assert.doesNotMatch(claim, /eq\('id', existing\.id\)\.eq\('owner_id', owner\.user\.id\)/);
});

test('My Websites is owner-scoped and grouped into simple publication states', async () => {
  const [customer, search] = await Promise.all([
    source('app/customer/page.js'),
    source('app/api/site/search/route.js')
  ]);
  assert.match(customer, /<h1>My Websites<\/h1>/);
  for (const heading of ['Published', 'Unpublished']) assert.match(customer, new RegExp(`>${heading}<`));
  assert.doesNotMatch(customer, /Purchases or Plans|Archived Websites/);
  assert.match(search, /\.eq\('owner_id', owner\.user\.id\)/);
  assert.match(search, /\.is\('owner_id', null\)\.eq\('customer_email', email\)/);
});

test('unpublish and recoverable delete recheck ownership and preserve protected records', async () => {
  const manage = await source('app/api/site/manage/route.js');
  assert.match(manage, /getVerifiedSiteOwner/);
  assert.match(manage, /siteBelongsToOwner/);
  assert.match(manage, /websiteDeletionConfirmationMatches/);
  assert.match(manage, /deletedWebsiteUpdate/);
  assert.match(manage, /unpublishedWebsiteUpdate/);
  assert.doesNotMatch(manage, /from\('websites'\)\.delete\(/);
});

test('Account provides export, local clearing, privacy, support, and confirmed deletion request', async () => {
  const [page, deletion] = await Promise.all([
    source('app/customer/account/page.js'),
    source('app/api/account/delete-request/route.js')
  ]);
  for (const label of ['Export My Data', 'Clear Local Guest Drafts', 'Clear AI Conversation History', 'Privacy Policy', 'Contact Support']) assert.match(page, new RegExp(label));
  assert.match(page, /DELETE MY ACCOUNT/);
  assert.match(deletion, /does not automatically cancel or refund/i);
});

test('guest publishing and paid checkout still require authenticated server routes', async () => {
  const [builder, publish, checkout] = await Promise.all([
    source('app/builder/page.js'),
    source('app/api/site/publish/route.js'),
    source('app/api/checkout/intent/continue/route.js')
  ]);
  assert.match(builder, /if \(!hasOwnerSession\)/);
  assert.match(builder, /openAccountModal/);
  assert.match(publish, /getVerifiedSiteOwner/);
  assert.match(publish, /websitePlanAccess/);
  assert.match(checkout, /getVerifiedSiteOwner/);
  assert.match(checkout, /siteBelongsToOwner/);
});

test('migration keeps guest claims server-only and website policies owner-scoped', async () => {
  const migration = await source('supabase/migrations/20260811120000_complete_customer_identity.sql');
  assert.match(migration, /alter table public\.guest_draft_claims enable row level security/);
  assert.match(migration, /revoke all on table public\.guest_draft_claims from anon, authenticated/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /\(select auth\.uid\(\)\) = owner_id/);
});
