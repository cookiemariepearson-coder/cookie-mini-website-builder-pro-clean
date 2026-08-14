import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  VIDEO_ENTITLEMENT_STATE,
  generationIsAuthorized,
  standaloneVideoEntitlement,
  websiteVideoEntitlement
} from '../lib/videoEntitlement.mjs';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const activeWebsite = {
  id: 'website-a',
  slug: 'website-a',
  plan: 'business',
  status: 'published',
  access_status: 'active',
  subscription_status: 'active',
  gumroad_product_id: 'RxLLDsLsLaQb1n6letAgSQ==',
  video_month_key: '2026-08',
  video_usage_month: 0,
  video_bonus_credits: 0
};
const now = new Date('2026-08-09T12:00:00Z');

test('1. fresh guest sees only the two simple starting choices', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, />Create My Account<\/button>/);
  assert.match(studio, />Sign In<\/button>/);
  assert.match(studio, /Create an account or sign in to purchase, create, and access your AI videos\./);
  assert.doesNotMatch(studio, />Verify Website Plan<|>Verify License</);
});

test('2. license entry appears only after the signed-in purchase recovery choice', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /startState === VIDEO_START_STATE\.LICENSE/);
  assert.match(studio, /I already purchased a \$5 video/);
  assert.match(studio, /id="video-license-key"/);
  assert.match(studio, /'Unlock My Video'/);
});

test('3. restored saved plan never becomes an unlocked entitlement by itself', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /fetch\('\/api\/video-access\/status'/);
  assert.doesNotMatch(studio, /function readAccessKind|setAccessKind\(savedKind\)/);
  assert.doesNotMatch(studio, /AI Video Studio unlocked/);
});

test('4. restored saved plan changes the verified primary action to Continue My Video', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /hasSavedPlan \? 'Continue My Video' : 'Start My Video'/);
  assert.match(studio, /Boolean\(clean\(biz\) \|\| clean\(promo\) \|\| clean\(details\)\)/);
});

test('5. restored saved plan never makes license verification globally visible', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /startState === VIDEO_START_STATE\.LICENSE/);
  assert.equal((studio.match(/id="video-license-key"/g) || []).length, 1);
  assert.doesNotMatch(studio, /data-testid="video-access-verification"/);
});

test('6. invalid entitlement keeps Generate disabled', () => {
  assert.equal(generationIsAuthorized({ serverVerified: false, state: VIDEO_ENTITLEMENT_STATE.INVALID, generationAllowed: true, remaining: 1 }), false);
});

test('7. missing license is rejected before verification', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /if \(!clean\(licenseKey\)\)/);
  assert.match(studio, /Enter the license key from your Gumroad receipt\./);
});

test('8. client state manipulation cannot authorize Generate without server verification', () => {
  assert.equal(generationIsAuthorized({ serverVerified: false, state: VIDEO_ENTITLEMENT_STATE.VERIFIED_STANDALONE, generationAllowed: true, remaining: 1 }), false);
  assert.equal(generationIsAuthorized({ serverVerified: true, state: VIDEO_ENTITLEMENT_STATE.PLANNING, generationAllowed: true, remaining: 1 }), false);
});

test('9. entering an email alone cannot authorize Generate', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /const canGenerate = Boolean\(accessToken\) && generationIsAuthorized\(entitlement\)/);
  assert.doesNotMatch(studio, /canGenerate\s*=.*customerEmail/);
});

test('10. valid standalone entitlement with an unused credit authorizes exactly one generation', () => {
  const entitlement = standaloneVideoEntitlement(0);
  assert.deepEqual({ state: entitlement.state, remaining: entitlement.remaining, allowed: generationIsAuthorized(entitlement) }, {
    state: VIDEO_ENTITLEMENT_STATE.VERIFIED_STANDALONE,
    remaining: 1,
    allowed: true
  });
});

test('11. used standalone credit cannot generate again', () => {
  const entitlement = standaloneVideoEntitlement(1);
  assert.equal(entitlement.state, VIDEO_ENTITLEMENT_STATE.NO_CREDIT);
  assert.equal(entitlement.remaining, 0);
  assert.equal(generationIsAuthorized(entitlement), false);
});

test('12. active eligible website plan is recognized server-side', () => {
  const entitlement = websiteVideoEntitlement(activeWebsite, { now, limits: { free: 0, starter: 0, business: 1, premium: 3 } });
  assert.equal(entitlement.state, VIDEO_ENTITLEMENT_STATE.VERIFIED_WEBSITE);
  assert.equal(generationIsAuthorized(entitlement), true);
});

test('13. inactive or ineligible website plan remains locked', () => {
  const limits = { free: 0, starter: 0, business: 1, premium: 3 };
  const inactive = websiteVideoEntitlement({ ...activeWebsite, subscription_status: 'cancelled' }, { now, limits });
  const starter = websiteVideoEntitlement({ ...activeWebsite, plan: 'starter' }, { now, limits });
  const wrongProduct = websiteVideoEntitlement({ ...activeWebsite, gumroad_product_id: 'GE_fDgvz_GT29Fn6eSj9uw==' }, { now, limits });
  assert.equal(inactive.generationAllowed, false);
  assert.equal(starter.generationAllowed, false);
  assert.equal(wrongProduct.generationAllowed, false);
});

test('14. locked Generate is visually and programmatically disabled', async () => {
  const [studio, css] = await Promise.all([source('app/video-studio/page.js'), source('app/globals.css')]);
  assert.match(studio, /if \(!canGenerate\)/);
  assert.match(studio, /wizardStep === 7 && canGenerate/);
  assert.equal((studio.match(/aria-disabled=\{working === 'video'\}/g) || []).length, 1);
  assert.match(css, /\.videoGenerateBtn:disabled,\.videoGenerateBtn\[aria-disabled="true"\]/);
  assert.match(css, /background:#d9d3dc/);
});

test('15. unauthorized generation API request is rejected before HeyGen', async () => {
  const create = await source('app/api/heygen/create/route.js');
  assert.ok(create.indexOf('const access = await checkCustomerAccess(request, body)') < create.indexOf("fetch('https://api.heygen.com/v3/video-agents'"));
  assert.match(create, /if \(!access\.ok\)/);
  assert.match(create, /verifyVideoAccessToken\(body\.accessToken \|\| ''\)/);
});

test('16. saved-plan data remains intact throughout entitlement verification', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /localStorage\.getItem\(VIDEO_PLAN_KEY\)/);
  assert.match(studio, /localStorage\.setItem\(VIDEO_PLAN_KEY/);
  assert.doesNotMatch(studio, /localStorage\.removeItem\(VIDEO_PLAN_KEY\)|localStorage\.clear\(/);
});
