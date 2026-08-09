import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { readFile } from 'node:fs/promises';
import { verifyVideoAccessToken } from '../lib/videoAccessToken.js';
import { authorizeVideoResultAccess, filterAuthorizedVideoJobs, standaloneVideoSlug, videoEmailHash, videoJobBelongsToAccess } from '../lib/videoResultAccess.js';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Customer A standalone video cannot be listed with Customer B email', () => {
  const accessA = { kind: 'standalone', saleId: 'sale-a', email: 'customer-a@example.com' };
  const authorizedA = authorizeVideoResultAccess({ access: accessA, requestedEmail: 'customer-a@example.com', requireIdentity: true });
  const jobs = [{ id: 'video-a', website_slug: standaloneVideoSlug('sale-a'), customer_email: 'customer-a@example.com' }];
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: accessA, authorized: authorizedA, requestedEmail: 'customer-a@example.com' }).map(job => job.id), ['video-a']);
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: accessA, authorized: authorizedA, requestedEmail: 'customer-b@example.com' }), []);
  assert.deepEqual(authorizeVideoResultAccess({ access: accessA, requireIdentity: true }), { ok: false, status: 403 });
});

test('legacy results email works only inside the already verified Gumroad sale namespace', () => {
  const accessA = { kind: 'standalone', saleId: 'sale-a', email: 'purchase-a@example.com' };
  const authorizedA = authorizeVideoResultAccess({ access: accessA, requestedEmail: 'saved-results@example.com', requireIdentity: true });
  const jobs = [
    { id: 'video-a', website_slug: standaloneVideoSlug('sale-a'), customer_email: 'saved-results@example.com' },
    { id: 'video-b', website_slug: standaloneVideoSlug('sale-b'), customer_email: 'saved-results@example.com' }
  ];
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: accessA, authorized: authorizedA, requestedEmail: 'saved-results@example.com' }).map(job => job.id), ['video-a']);
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: accessA, authorized: authorizedA, requestedEmail: 'unknown@example.com' }), []);
});

test('website video access is bound to the signed-in owner, email, and website slug', () => {
  const accessA = { kind: 'website-plan', ownerId: 'owner-a', slug: 'site-a' };
  const ownerA = { user: { id: 'owner-a' }, email: 'customer-a@example.com' };
  const ownerB = { user: { id: 'owner-b' }, email: 'customer-b@example.com' };
  assert.equal(authorizeVideoResultAccess({ access: accessA, owner: ownerA, requestedSlug: 'site-a', requireIdentity: true }).ok, true);
  assert.deepEqual(authorizeVideoResultAccess({ access: accessA, owner: ownerB, requestedSlug: 'site-a', requireIdentity: true }), { ok: false, status: 403 });
  assert.deepEqual(authorizeVideoResultAccess({ access: accessA, owner: ownerA, requestedEmail: 'customer-b@example.com', requireIdentity: true }), { ok: false, status: 403 });
  assert.deepEqual(authorizeVideoResultAccess({ access: accessA, owner: ownerA, requestedSlug: 'site-b', requireIdentity: true }), { ok: false, status: 403 });
});

test('Customer A job ID remains denied to Customer B access', () => {
  const slugA = standaloneVideoSlug('sale-a');
  const slugB = standaloneVideoSlug('sale-b');
  assert.equal(videoJobBelongsToAccess(slugA, slugA), true);
  assert.equal(videoJobBelongsToAccess(slugA, slugB), false);
  assert.equal(videoJobBelongsToAccess(slugA, ''), false);
});

test('new standalone passes bind a purchase namespace to a hashed verified email', () => {
  const accessA = {
    kind: 'standalone',
    namespace: standaloneVideoSlug('sale-a'),
    emailHash: videoEmailHash('customer-a@example.com')
  };
  const authorized = authorizeVideoResultAccess({ access: accessA, requestedEmail: 'customer-a@example.com', requireIdentity: true });
  const jobs = [{ id: 'video-a', website_slug: standaloneVideoSlug('sale-a'), customer_email: 'customer-a@example.com' }];
  assert.equal(authorized.ok, true);
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: accessA, authorized, requestedEmail: 'customer-a@example.com' }).map(row => row.id), ['video-a']);
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: accessA, authorized, requestedEmail: 'customer-b@example.com' }), []);
});

test('unsigned, invalid, and expired video access passes are denied', () => {
  const previous = process.env.VIDEO_ACCESS_SIGNING_SECRET;
  process.env.VIDEO_ACCESS_SIGNING_SECRET = 'test-only-secret';
  assert.equal(verifyVideoAccessToken(''), null);
  assert.equal(verifyVideoAccessToken('not.a-valid-signature'), null);
  const data = Buffer.from(JSON.stringify({ kind: 'standalone', saleId: 'sale-a', email: 'a@example.com', exp: Date.now() - 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.VIDEO_ACCESS_SIGNING_SECRET).update(data).digest('base64url');
  assert.equal(verifyVideoAccessToken(`${data}.${signature}`), null);
  if (previous === undefined) delete process.env.VIDEO_ACCESS_SIGNING_SECRET;
  else process.env.VIDEO_ACCESS_SIGNING_SECRET = previous;
});

test('video endpoints enforce server ownership and never disclose provider media URLs', async () => {
  const [jobs, status, media, results, create, migration] = await Promise.all([
    source('app/api/heygen/jobs/route.js'),
    source('app/api/heygen/status/route.js'),
    source('app/api/heygen/media/route.js'),
    source('app/video-studio/results/page.js'),
    source('app/api/heygen/create/route.js'),
    source('supabase/heygen_video_results_migration.sql')
  ]);
  assert.match(jobs, /requireIdentity: true/);
  assert.match(jobs, /filterAuthorizedVideoJobs/);
  assert.match(jobs, /customer_email/);
  assert.match(jobs, /video_available: Boolean\(video_url\)/);
  assert.match(status, /select=id,website_slug,heygen_session_id,heygen_video_id/);
  assert.doesNotMatch(status, /String\(body\.videoId/);
  assert.match(media, /videoJobBelongsToAccess/);
  assert.match(media, /X-Content-Type-Options/);
  assert.doesNotMatch(results, /Copy Video Link/);
  assert.match(results, /\/api\/heygen\/media\?jobId=/);
  assert.match(results, /Verify Gumroad Purchase & Find Videos/);
  assert.doesNotMatch(create, /heygenSessionUrl:/);
  assert.match(migration, /heygen_video_jobs_request_key_unique/);
  assert.match(migration, /heygen_video_jobs_standalone_purchase_unique/);
  assert.match(migration, /revoke all on table public\.heygen_video_jobs from anon, authenticated/i);
});
