import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { standaloneVideoEntitlement } from '../lib/videoEntitlement.mjs';
import {
  VIDEO_JOB_STATE,
  VIDEO_START_STATE,
  resolveVideoStartState,
  summarizeVideoJobs
} from '../lib/videoJourney.mjs';
import { authorizeVideoResultAccess, filterAuthorizedVideoJobs, standaloneVideoSlug } from '../lib/videoResultAccess.js';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. brand-new signed-out visitor receives the simple two-choice start state', () => {
  assert.equal(resolveVideoStartState({ signedIn: false, verified: false }), VIDEO_START_STATE.SIGNED_OUT);
});

test('2. authenticated customer with an available verified credit can start', () => {
  assert.equal(resolveVideoStartState({ signedIn: true, verified: true, remaining: 1 }), VIDEO_START_STATE.AVAILABLE);
});

test('3. zero-credit customer with a completed video receives the used-credit state', () => {
  assert.equal(resolveVideoStartState({ verified: true, remaining: 0, jobState: VIDEO_JOB_STATE.COMPLETED }), VIDEO_START_STATE.USED_CREDIT);
});

test('4. a saved plan is restored and changes Start to Continue without granting access', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /localStorage\.getItem\(VIDEO_PLAN_KEY\)/);
  assert.match(studio, /hasSavedPlan \? 'Continue My Video' : 'Start My Video'/);
  assert.match(studio, /const canGenerate = Boolean\(accessToken\) && generationIsAuthorized\(entitlement\)/);
});

test('5. a processing job takes routing priority', () => {
  const summary = summarizeVideoJobs([{ id: 'done', status: 'completed' }, { id: 'new', status: 'generating' }]);
  assert.equal(summary.jobState, VIDEO_JOB_STATE.PROCESSING);
  assert.equal(resolveVideoStartState({ verified: true, remaining: 0, jobState: summary.jobState }), VIDEO_START_STATE.PROCESSING);
});

test('6. a completed result with another credit routes to results', () => {
  assert.equal(resolveVideoStartState({ verified: true, remaining: 1, jobState: VIDEO_JOB_STATE.COMPLETED }), VIDEO_START_STATE.COMPLETED);
});

test('7. one eligible Business or Premium website is selected server-side', async () => {
  const activate = await source('app/api/video-access/activate/route.js');
  assert.match(activate, /eligible\[0\]/);
  assert.match(activate, /verifiedWebsiteResponse\(selected\.site, selected\.entitlement, owner\.user\.id\)/);
});

test('8. multiple eligible websites return only a safe selector', async () => {
  const [activate, studio] = await Promise.all([source('app/api/video-access/activate/route.js'), source('app/video-studio/page.js')]);
  assert.match(activate, /eligible\.length > 1/);
  assert.match(activate, /selectionRequired: true/);
  assert.match(studio, /id="eligible-video-website"/);
  assert.doesNotMatch(studio, /Business\/Premium customer email|Website name or subdomain/);
});

test('9. standalone Gumroad buyer sees the license field only after choosing purchase recovery', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /I already purchased a \$5 video/);
  assert.match(studio, /Enter the license key from your Gumroad receipt\./);
  assert.match(studio, /Unlock My Video/);
});

test('10. invalid purchase stays locked and an already-used purchase has zero credit', async () => {
  const activate = await source('app/api/video-access/activate/route.js');
  assert.match(activate, /if \(!result\.valid\).*status|if \(!result\.valid\).*403/);
  assert.equal(standaloneVideoEntitlement(1).remaining, 0);
  assert.equal(standaloneVideoEntitlement(1).generationAllowed, false);
});

test('11. returning from Gumroad resumes at the license step', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /get\('activate'\) === '1'/);
  assert.match(studio, /if \(purchaseReturn\)[\s\S]*setScreen\(VIDEO_START_STATE\.LICENSE\)/);
});

test('12. returning from customer sign-in resumes the video flow', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /sessionStorage\.setItem\(RESUME_AFTER_SIGN_IN_KEY, '1'\)/);
  assert.match(studio, /activateAccount\('', autoContinue\)/);
});

test('13. Back and refresh preserve every planning step', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /wizardStep, savedAt: Date\.now\(\)/);
  assert.match(studio, /setWizardStep\(Math\.min\(7, Math\.max\(1, Number\(savedPlan\.wizardStep \|\| 1\)\)\)\)/);
  assert.match(studio, /function previousStep\(\)/);
});

test('14. duplicate clicks and repeated submissions share one protected request', async () => {
  const [studio, create] = await Promise.all([source('app/video-studio/page.js'), source('app/api/heygen/create/route.js')]);
  assert.match(studio, /if \(submissionInFlightRef\.current\) return/);
  assert.match(studio, /generationRequestRef\.current = window\.crypto\.randomUUID\(\)/);
  assert.match(create, /request_key/);
  assert.match(create, /existingGenerationResponse/);
});

test('15. mobile layout retains five progress stages and 48px primary touch targets', async () => {
  const css = await source('app/website-experience-refresh.css');
  assert.match(css, /@media\(max-width:760px\)[\s\S]*\.studioSteps\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css, /\.videoPrimaryActions \.btn,[\s\S]*min-height:48px/);
});

test('16. keyboard navigation moves focus to each new wizard heading', async () => {
  const [studio, globals] = await Promise.all([source('app/video-studio/page.js'), source('app/globals.css')]);
  assert.match(studio, /stepHeadingRef\.current\?\.focus\(\)/);
  assert.match(studio, /tabIndex="-1"/);
  assert.match(globals, /:focus-visible/);
});

test('17. screen-reader labels and live errors are present', async () => {
  const studio = await source('app/video-studio/page.js');
  for (const id of ['video-license-key', 'video-business', 'video-promotion', 'video-goal', 'video-platform', 'video-audience', 'video-style', 'video-voice', 'video-length', 'video-details']) {
    assert.match(studio, new RegExp(`htmlFor="${id}"`));
    assert.match(studio, new RegExp(`id="${id}"`));
  }
  assert.match(studio, /role="status" aria-live="polite"/);
  assert.match(studio, /role="alert"/);
});

test('18. cross-customer result isolation remains enforced', () => {
  const access = { kind: 'standalone', namespace: standaloneVideoSlug('sale-a'), ownerId: 'owner-a' };
  const authorized = authorizeVideoResultAccess({ access, owner: { user: { id: 'owner-a' } } });
  const jobs = [{ id: 'a', website_slug: access.namespace, customer_email: 'a@example.com' }];
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access, authorized }).map(job => job.id), ['a']);
  assert.deepEqual(filterAuthorizedVideoJobs(jobs, { access: { ...access, ownerId: 'owner-b' }, authorized }), []);
});

test('19. signed-out protected jobs and results still require a signed access pass', async () => {
  const [jobs, media] = await Promise.all([source('app/api/heygen/jobs/route.js'), source('app/api/heygen/media/route.js')]);
  assert.match(jobs, /if \(!access\).*status: 401/);
  assert.match(media, /if \(!access\).*status: 401/);
});

test('20. purchase-to-download journey uses the approved checkout and protected media route', async () => {
  const [studio, activate, create, results] = await Promise.all([
    source('app/video-studio/page.js'),
    source('app/api/video-access/activate/route.js'),
    source('app/api/heygen/create/route.js'),
    source('app/video-studio/results/page.js')
  ]);
  assert.match(studio, /href="\/checkout\/ai-video"/);
  assert.match(activate, /verifyAiVideoLicense/);
  assert.match(create, /resultsDashboard: '\/video-studio\/results'/);
  assert.match(results, /fetchVideoBlob\(job\)/);
  assert.match(results, /Download My Video/);
});
