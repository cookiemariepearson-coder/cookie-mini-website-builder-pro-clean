import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  customerWebsiteStatus,
  deletedWebsiteUpdate,
  unpublishedWebsiteUpdate,
  websiteDeletionConfirmationMatches,
  websiteDisplayName
} from '../lib/customerWebsiteManagement.mjs';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. customer with no websites receives a friendly creation state', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /No websites yet/);
  assert.match(page, /Create a New Website/);
  assert.match(page, /You can save it, publish it, and return here/);
});

test('2. customer with one published website receives published actions', () => {
  assert.equal(customerWebsiteStatus({ status: 'published', access_status: 'active' }), 'published');
});

test('3. customer with one unpublished website receives the unpublished state', () => {
  assert.equal(customerWebsiteStatus({ status: 'draft', access_status: 'active' }), 'unpublished');
});

test('4. customer with multiple websites renders every owner-scoped card', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /publishedSites\.map\(renderSiteCard\)/);
  assert.match(page, /unpublishedSites\.map\(renderSiteCard\)/);
  assert.match(page, /key=\{row\.slug\}/);
});

test('5. Published and Unpublished sections are clear and simple', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, />Published</);
  assert.match(page, />Unpublished</);
  assert.match(page, /Visitors can open these websites/);
  assert.match(page, /saved but not open to visitors/);
  assert.doesNotMatch(page, /Purchases or Plans|Archived Websites/);
});

test('6. Edit Website routes to the secure customer editor and preserves dashboard position', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /href=\{`\/customer\/edit\/\$\{row\.slug\}`\}/);
  assert.match(page, /rememberDashboardState\(row\.slug\)/);
  assert.match(page, /sessionStorage\.setItem\(DASHBOARD_STATE_KEY/);
});

test('7. View Website is available only for a published website', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /\{isPublished && <a[^>]+>View Website<\/a>\}/);
  assert.match(page, /target="_blank"/);
});

test('8. successful unpublish removes public access while preserving content', async () => {
  const [route, publicPage] = await Promise.all([
    source('app/api/site/manage/route.js'),
    source('app/site/[slug]/page.js')
  ]);
  const site = { status: 'published', site: { headline: 'Keep me' } };
  const update = unpublishedWebsiteUpdate(site, '2026-08-14T15:00:00.000Z');
  assert.equal(update.status, 'draft');
  assert.equal(update.site.headline, 'Keep me');
  assert.equal(update.site.status, 'draft');
  assert.match(route, /Website unpublished\. Visitors can no longer open it/);
  assert.match(publicPage, /status !== 'published'/);
});

test('9. canceling unpublish keeps the website published and makes no request', async () => {
  const dialog = await source('components/WebsiteManagementDialog.js');
  assert.match(dialog, /Keep Website Published/);
  assert.match(dialog, /onClick=\{onCancel\}/);
  assert.doesNotMatch(dialog, /onCancel.*fetch/s);
});

test('10. an unpublished website can be edited and republished safely', async () => {
  const [save, editor] = await Promise.all([
    source('app/api/site/save/route.js'),
    source('app/customer/edit/[slug]/page.js')
  ]);
  assert.match(save, /status: 'published'/);
  assert.match(save, /customer_unpublished_at: null/);
  assert.match(save, /siteBelongsToOwner\(existing, owner\)/);
  assert.match(editor, /Save & Publish/);
});

test('11. successful deletion moves a website to recoverable Trash without hard deletion', async () => {
  const route = await source('app/api/site/manage/route.js');
  const site = { slug: 'cookie-shop', business_name: 'Cookie Shop', status: 'published', site: { headline: 'Saved' } };
  const update = deletedWebsiteUpdate(site, '2026-08-14T15:00:00.000Z');
  assert.equal(update.status, 'deleted');
  assert.equal(update.site.headline, 'Saved');
  assert.equal(update.customer_deleted_at, '2026-08-14T15:00:00.000Z');
  assert.match(route, /Website moved to recoverable Trash/);
  assert.doesNotMatch(route, /from\('websites'\)\.delete\(/);
});

test('12. canceling deletion keeps the website and restores focus', async () => {
  const dialog = await source('components/WebsiteManagementDialog.js');
  assert.match(dialog, /Keep My Website/);
  assert.match(dialog, /returnFocus\?\.isConnected/);
  assert.match(dialog, /fallbackFocusRef\?\.current\?\.focus/);
});

test('13. incorrect deletion confirmation text fails closed', async () => {
  const route = await source('app/api/site/manage/route.js');
  const site = { slug: 'cookie-shop', business_name: 'Cookie Shop' };
  assert.equal(websiteDisplayName(site), 'Cookie Shop');
  assert.equal(websiteDeletionConfirmationMatches(site, 'Wrong Website'), false);
  assert.equal(websiteDeletionConfirmationMatches(site, '  COOKIE   SHOP '), true);
  assert.match(route, /The website name did not match\. Nothing was deleted/);
});

test('14. duplicate deletion is blocked in the client and atomically on the server', async () => {
  const [page, route] = await Promise.all([
    source('app/customer/page.js'),
    source('app/api/site/manage/route.js')
  ]);
  assert.match(page, /if \(!managementDialog \|\| managementBusy\) return/);
  assert.match(route, /\.neq\('status', 'deleted'\)/);
  assert.match(route, /\.is\('customer_deleted_at', null\)/);
  assert.match(route, /No duplicate deletion was made/);
});

test('15. cross-customer unpublish is denied before any mutation', async () => {
  const route = await source('app/api/site/manage/route.js');
  const ownership = route.indexOf('siteBelongsToOwner(foundSite, owner)');
  const unpublish = route.indexOf("action === 'unpublish'");
  assert.ok(ownership >= 0 && unpublish > ownership);
  assert.match(route, /You do not have access to manage this website/);
});

test('16. cross-customer deletion is denied and every update is owner-scoped', async () => {
  const route = await source('app/api/site/manage/route.js');
  assert.match(route, /siteBelongsToOwner\(foundSite, owner\)/);
  assert.match(route, /\.eq\('id', site\.id\)\s*\.eq\('owner_id', owner\.user\.id\)/s);
});

test('17. signed-out website management is denied with a private response', async () => {
  const route = await source('app/api/site/manage/route.js');
  const auth = route.indexOf('getVerifiedSiteOwner(request)');
  const lookup = route.indexOf("from('websites')");
  assert.ok(auth >= 0 && lookup > auth);
  assert.match(route, /private, no-store, max-age=0/);
});

test('18. deleting a website preserves the customer account, subscription, purchase, and entitlement fields', () => {
  const update = deletedWebsiteUpdate({ status: 'published', plan: 'business', subscription_status: 'active', gumroad_sale_id: 'kept' }, '2026-08-14T15:00:00.000Z');
  for (const protectedField of ['owner_id', 'plan', 'subscription_status', 'gumroad_sale_id', 'access_status']) {
    assert.equal(protectedField in update, false);
  }
});

test('19. deleting one website does not touch other websites or AI Video records', async () => {
  const route = await source('app/api/site/manage/route.js');
  assert.match(route, /\.eq\('id', site\.id\)/);
  assert.doesNotMatch(route, /heygen_video_jobs|ai_video_purchase_claims/);
  assert.doesNotMatch(route, /auth\.admin\.deleteUser|gumroad_events.*delete|website_checkout_intents.*delete/);
});

test('20. dashboard and confirmation dialogs preserve mobile, keyboard, focus, screen-reader, and error access', async () => {
  const [page, dialog, css] = await Promise.all([
    source('app/customer/page.js'),
    source('components/WebsiteManagementDialog.js'),
    source('app/globals.css')
  ]);
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /event\.key === 'Escape'/);
  assert.match(dialog, /event\.key !== 'Tab'/);
  assert.match(dialog, /role="alert"/);
  assert.match(page, /aria-live=\{messageIsError \? 'assertive' : 'polite'\}/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /:focus-visible/);
});
