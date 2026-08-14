import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  VIDEO_ENTITLEMENT_STATE,
  generationIsAuthorized,
  standaloneVideoEntitlement
} from '../lib/videoEntitlement.mjs';
import {
  authorizeVideoResultAccess,
  filterAuthorizedVideoJobs,
  standaloneVideoSlug,
  videoEmailHash,
  videoJobBelongsToAccess
} from '../lib/videoResultAccess.js';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const ownerAccess = {
  kind: 'standalone',
  namespace: standaloneVideoSlug('sale-owner'),
  emailHash: videoEmailHash('owner@example.com')
};
const ownerJob = {
  id: 'job-owner',
  website_slug: ownerAccess.namespace,
  customer_email: 'owner@example.com',
  status: 'completed'
};

test('successful provider acceptance reserves exactly one standalone credit', () => {
  const before = standaloneVideoEntitlement(0);
  const after = standaloneVideoEntitlement(1);
  assert.equal(before.remaining, 1);
  assert.equal(after.used, 1);
  assert.equal(after.remaining, 0);
  assert.equal(after.state, VIDEO_ENTITLEMENT_STATE.NO_CREDIT);
});

test('status refresh updates only the existing job and never consumes another credit', async () => {
  const status = await source('app/api/heygen/status/route.js');
  assert.match(status, /supabasePatch\(`heygen_video_jobs\?id=eq\./);
  assert.doesNotMatch(status, /supabasePost|incrementUsage|video_usage_month/);
});

test('completed playback is read-only and never consumes another credit', async () => {
  const media = await source('app/api/heygen/media/route.js');
  assert.match(media, /export async function GET/);
  assert.doesNotMatch(media, /method:\s*['"](?:POST|PATCH|DELETE)['"]|incrementUsage|video_usage_month/);
});

test('download uses the same protected read-only media route', async () => {
  const [media, results] = await Promise.all([
    source('app/api/heygen/media/route.js'),
    source('app/video-studio/results/page.js')
  ]);
  assert.match(results, /fetchVideoBlob\(job\)/);
  assert.match(results, /\/api\/heygen\/media\?jobId=/);
  assert.match(media, /Content-Disposition/);
  assert.doesNotMatch(results, /video_usage_month|incrementUsage/);
});

test('duplicate standalone generation is rejected before provider submission', async () => {
  const create = await source('app/api/heygen/create/route.js');
  const priorCheck = create.indexOf('heygen_video_jobs?website_slug=eq.');
  const providerCall = create.indexOf("fetch('https://api.heygen.com/v3/video-agents'");
  assert.ok(priorCheck > -1 && priorCheck < providerCall);
  assert.match(create, /included with this \$5 license has already been used/);
});

test('consumed standalone entitlement cannot authorize another generation', () => {
  const consumed = standaloneVideoEntitlement(1);
  assert.equal(generationIsAuthorized(consumed), false);
  assert.equal(consumed.generationAllowed, false);
});

test('the same verified owner can retrieve the completed result', () => {
  const authorized = authorizeVideoResultAccess({ access: ownerAccess, requestedEmail: 'owner@example.com', requireIdentity: true });
  assert.equal(authorized.ok, true);
  assert.deepEqual(filterAuthorizedVideoJobs([ownerJob], { access: ownerAccess, authorized, requestedEmail: 'owner@example.com' }), [ownerJob]);
});

test('a different customer cannot retrieve the completed result', () => {
  const authorized = authorizeVideoResultAccess({ access: ownerAccess, requestedEmail: 'different@example.com', requireIdentity: true });
  assert.deepEqual(filterAuthorizedVideoJobs([ownerJob], { access: ownerAccess, authorized, requestedEmail: 'different@example.com' }), []);
});

test('direct unauthorized result and status access require a signed pass', async () => {
  const [jobs, status] = await Promise.all([
    source('app/api/heygen/jobs/route.js'),
    source('app/api/heygen/status/route.js')
  ]);
  assert.match(jobs, /if \(!access\).*status: 401/);
  assert.match(status, /if \(!access \|\| !jobId\).*status: 401/);
  assert.match(status, /videoJobBelongsToAccess/);
});

test('direct unauthorized playback and download require owner-scoped access', async () => {
  const media = await source('app/api/heygen/media/route.js');
  assert.match(media, /if \(!access\).*status: 401/);
  assert.match(media, /videoJobBelongsToAccess/);
  assert.equal(videoJobBelongsToAccess(ownerJob.website_slug, standaloneVideoSlug('sale-different')), false);
});

test('email alone never authorizes result access', () => {
  assert.deepEqual(authorizeVideoResultAccess({ access: null, requestedEmail: 'owner@example.com', requireIdentity: true }), { ok: false, status: 401 });
  assert.deepEqual(filterAuthorizedVideoJobs([ownerJob], { access: null, authorized: null, requestedEmail: 'owner@example.com' }), []);
});

test('client-side entitlement manipulation cannot restore a consumed credit', () => {
  assert.equal(generationIsAuthorized({
    serverVerified: false,
    state: VIDEO_ENTITLEMENT_STATE.VERIFIED_STANDALONE,
    generationAllowed: true,
    remaining: 1
  }), false);
});

test('post-generation UI displays an explicit consumed-credit state', async () => {
  const [studio, status, activate] = await Promise.all([
    source('app/video-studio/page.js'),
    source('app/api/video-access/status/route.js'),
    source('app/api/video-access/activate/route.js')
  ]);
  assert.match(studio, /You have used your video credit\./);
  assert.match(studio, /Buy Another Video — \$5/);
  assert.match(studio, /View My Video/);
  assert.match(status, /Your 1 included video credit has been used\. 0 video credits available\./);
  assert.match(activate, /Your 1 included video credit has been used\. 0 video credits available\./);
});
