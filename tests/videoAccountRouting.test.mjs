import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { safeCustomerReturnPath } from '../lib/commerceConfig.mjs';
import { authorizeVideoResultAccess, standaloneVideoSlug } from '../lib/videoResultAccess.js';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. top-navigation AI Video sends signed-out visitors to the account-gated studio', async () => {
  const [nav, studio] = await Promise.all([source('lib/Nav.jsx'), source('app/video-studio/page.js')]);
  assert.match(nav, /href="\/video-studio">AI Video/);
  assert.match(studio, />Create My Account<\/button>[\s\S]*>Sign In<\/button>/);
  assert.match(studio, /Create an account or sign in to purchase, create, and access your AI videos\./);
});

test('2. middle-homepage AI Video links preserve purchase intent behind the same gate', async () => {
  const homepage = await source('app/page.js');
  assert.equal((homepage.match(/href="\/video-studio\?intent=purchase"/g) || []).length, 2);
  assert.doesNotMatch(homepage, /href="\/checkout\/ai-video"/);
});

test('3. pricing and product AI Video entrances cannot bypass customer authentication', async () => {
  const [pricing, builder] = await Promise.all([source('app/pricing/page.js'), source('app/builder/page.js')]);
  assert.equal((pricing.match(/href="\/video-studio\?intent=purchase"/g) || []).length, 2);
  assert.match(builder, /window\.location\.href = '\/video-studio\?intent=purchase'/);
});

test('4. new account creation returns automatically to the intended AI Video screen', async () => {
  const [studio, provider] = await Promise.all([source('app/video-studio/page.js'), source('components/AccountModalProvider.js')]);
  assert.match(studio, /signInForVideo\('create'\)/);
  assert.match(provider, /\/video-studio\\\?\(\?:intent=purchase\|claim=1\)/);
  assert.match(provider, /window\.location\.assign\(safeDestination\(destination\)\)/);
});

test('5. existing customer sign-in returns automatically without suggesting another account', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /signInForVideo\('signin'\)/);
  assert.match(studio, /if \(accountState !== 'signed-in'\)/);
  assert.match(studio, /await activateAccount\('', autoContinue\)/);
});

test('6. purchase intent survives account creation only as an allowlisted internal destination', () => {
  assert.equal(safeCustomerReturnPath('/video-studio?intent=purchase'), '/video-studio?intent=purchase');
  assert.equal(safeCustomerReturnPath('/video-studio?intent=purchase&paid=1'), '/customer');
});

test('7. purchase intent survives sign-in without accepting an external or forged return', () => {
  assert.equal(safeCustomerReturnPath('/video-studio?claim=1'), '/video-studio?claim=1');
  assert.equal(safeCustomerReturnPath('https://attacker.example/video-studio?claim=1'), '/customer');
});

test('8. only a signed-in customer can start the five-dollar Gumroad checkout', async () => {
  const checkout = await source('app/checkout/ai-video/page.js');
  assert.match(checkout, /accountState === 'signed-out'[\s\S]*Create My Account[\s\S]*Sign In/);
  assert.match(checkout, /accountState === 'signed-in'[\s\S]*Continue to Secure Gumroad Checkout/);
  assert.match(checkout, /if \(!checkoutUrl \|\| checkoutInFlight\.current \|\| accountState !== 'signed-in'\) return/);
});

test('9. Gumroad return with a valid customer session continues to secure purchase claim', async () => {
  const [checkout, studio] = await Promise.all([source('app/checkout/ai-video/page.js'), source('app/video-studio/page.js')]);
  assert.match(checkout, /href="\/video-studio\?claim=1"/);
  assert.ok(studio.indexOf("if (accountState !== 'signed-in')") < studio.indexOf('if (purchaseReturn)'));
  assert.match(studio, /setScreen\(VIDEO_START_STATE\.LICENSE\)/);
});

test('10. Gumroad return with an expired session keeps claim intent and shows both account choices', async () => {
  const studio = await source('app/video-studio/page.js');
  assert.match(studio, /return purchaseReturn \? '\/video-studio\?claim=1'/);
  assert.match(studio, />Create My Account<\/button>[\s\S]*>Sign In<\/button>/);
  assert.doesNotMatch(studio, /licenseKey.*URLSearchParams|URLSearchParams.*licenseKey/);
});

test('11. purchase claim requires both authenticated owner and exact server-side Gumroad verification', async () => {
  const activate = await source('app/api/video-access/activate/route.js');
  assert.ok(activate.indexOf('const owner = await getVerifiedSiteOwner(request)') < activate.indexOf('const result = await verifyAiVideoLicense'));
  assert.match(activate, /GUMROAD_AI_VIDEO_PRODUCT_ID/);
  assert.match(activate, /claimStandalonePurchase/);
});

test('12. an existing paid purchase is claimed idempotently without payment or generation', async () => {
  const [claim, migration] = await Promise.all([source('lib/videoPurchaseClaim.js'), source('supabase/migrations/20260814120000_ai_video_purchase_claims.sql')]);
  assert.match(claim, /alreadyClaimed: true/);
  assert.match(claim, /concurrent request may win the unique insert/);
  assert.match(migration, /purchase_namespace text not null unique/i);
  assert.doesNotMatch(claim, /HEYGEN_API_KEY|video-agents|checkoutUrl/);
});

test('13. an existing completed video is reacquired from account state after sign-in', async () => {
  const results = await source('app/video-studio/results/page.js');
  assert.match(results, /body: JSON\.stringify\(\{ mode: 'account' \}\)/);
  assert.match(results, /fetch\('\/api\/heygen\/jobs'/);
  assert.doesNotMatch(results, /cookieVerifiedVideoEmail|accessPayload\(/);
});

test('14. an already signed-in customer is never encouraged to create a duplicate account', async () => {
  const studio = await source('app/video-studio/page.js');
  const signedOutPanel = studio.slice(studio.indexOf('if (startState === VIDEO_START_STATE.SIGNED_OUT)'), studio.indexOf('if (startState === VIDEO_START_STATE.LICENSE)'));
  assert.match(signedOutPanel, /Create My Account/);
  const noCreditPanel = studio.slice(studio.indexOf('return <div className="videoStateCard">\n      <h2>No video credits are available.'), studio.indexOf('function wizardPanel'));
  assert.doesNotMatch(noCreditPanel, /Create My Account/);
});

test('15. Business and Premium account routing remains server-owned and plan-verified', async () => {
  const activate = await source('app/api/video-access/activate/route.js');
  assert.match(activate, /eligibleOwnerWebsites\(owner\)/);
  assert.match(activate, /websiteVideoEntitlement/);
  assert.match(activate, /verifiedWebsiteResponse\(selected\.site, selected\.entitlement, owner\.user\.id\)/);
});

test('16. standalone routing issues an owner-bound token and never a browser-email token', async () => {
  const activate = await source('app/api/video-access/activate/route.js');
  assert.match(activate, /kind: 'standalone', namespace, ownerId/);
  assert.doesNotMatch(activate, /createVideoAccessToken\(\{ kind: 'standalone'[^}]*email/);
});

test('17. duplicate checkout clicks and duplicate generation submissions are blocked', async () => {
  const [checkout, studio, create] = await Promise.all([source('app/checkout/ai-video/page.js'), source('app/video-studio/page.js'), source('app/api/heygen/create/route.js')]);
  assert.match(checkout, /checkoutInFlight\.current/);
  assert.match(studio, /submissionInFlightRef\.current/);
  assert.match(create, /request_key/);
  assert.match(create, /existingGenerationResponse/);
});

test('18. cross-customer purchase and video access is denied by immutable owner id', () => {
  const access = { kind: 'standalone', namespace: standaloneVideoSlug('sale-a'), ownerId: 'owner-a' };
  assert.equal(authorizeVideoResultAccess({ access, owner: { user: { id: 'owner-a' } } }).ok, true);
  assert.deepEqual(authorizeVideoResultAccess({ access, owner: { user: { id: 'owner-b' } } }), { ok: false, status: 403 });
});

test('19. signed-out status, results, playback, and download requests are denied', async () => {
  const routes = await Promise.all(['video-access/status', 'heygen/jobs', 'heygen/status', 'heygen/media'].map(path => source(`app/api/${path}/route.js`)));
  for (const route of routes) {
    assert.match(route, /getVerifiedSiteOwner|if \(!access\).*status: 401/);
    assert.match(route, /private, no-store, max-age=0/);
  }
});

test('20. account routing remains mobile, keyboard, screen-reader, and live-error accessible', async () => {
  const [studio, checkout, css, globals] = await Promise.all([source('app/video-studio/page.js'), source('app/checkout/ai-video/page.js'), source('app/website-experience-refresh.css'), source('app/globals.css')]);
  assert.match(css, /\.videoPrimaryActions \.btn,[\s\S]*min-height:48px/);
  assert.match(globals, /:focus-visible/);
  assert.match(studio, /licenseInputRef\.current\?\.focus\(\)/);
  assert.match(studio, /role="status" aria-live="polite"/);
  assert.match(checkout, /aria-busy="true"|aria-disabled=\{leaving\}/);
});
