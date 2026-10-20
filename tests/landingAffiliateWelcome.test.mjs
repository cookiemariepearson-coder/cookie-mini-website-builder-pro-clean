import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { customerWelcomeName } from '../lib/customerWelcome.mjs';
import {
  DEFAULT_AMAZON_AFFILIATE_URL,
  normalizeAmazonAffiliateUrl,
  safeAmazonAffiliateUrl
} from '../lib/amazonAffiliate.mjs';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('signed-in welcome uses the customer display name and greets the canonical owner personally', () => {
  assert.equal(customerWelcomeName('Janet Smith', 'janet@example.com'), 'Janet');
  assert.equal(customerWelcomeName('', 'customer_name@example.com'), 'Customer');
  assert.equal(customerWelcomeName('Other Name', 'cookiemariepearson@gmail.com'), 'Cookie');
});

test('weekly Amazon links accept HTTPS Amazon links and amzn.to short links only', () => {
  assert.equal(normalizeAmazonAffiliateUrl('https://amzn.to/3VTO2he'), 'https://amzn.to/3VTO2he');
  assert.equal(normalizeAmazonAffiliateUrl('https://www.amazon.com/dp/B012345678'), 'https://www.amazon.com/dp/B012345678');
  assert.equal(normalizeAmazonAffiliateUrl('http://amzn.to/3VTO2he'), '');
  assert.equal(normalizeAmazonAffiliateUrl('https://amazon.com.attacker.invalid/dp/xyz'), '');
  assert.equal(safeAmazonAffiliateUrl('not a URL'), DEFAULT_AMAZON_AFFILIATE_URL);
});

test('weekly pick is at the top of landing page and clearly discloses affiliate relationship', async () => {
  const [home, spot, publicSetting, protectedSetting, migration] = await Promise.all([
    source('app/page.js'),
    source('components/AmazonAffiliateSpot.js'),
    source('app/api/landing-settings/route.js'),
    source('app/api/admin/landing-settings/route.js'),
    source('supabase/migrations/20261020143000_landing_affiliate_settings.sql')
  ]);
  assert.match(home, /<AmazonAffiliateSpot \/>[\s\S]*<section className="brandHero">/);
  assert.match(spot, /As an Amazon Associate, I earn from qualifying purchases/);
  assert.match(spot, /rel="sponsored nofollow noopener noreferrer"/);
  assert.match(publicSetting, /from\('landing_settings'\)/);
  assert.match(protectedSetting, /getVerifiedAdmin\(request\)/);
  assert.match(protectedSetting, /normalizeAmazonAffiliateUrl/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.landing_settings from anon, authenticated/i);
});

test('Admin Access shortcut is only rendered for the exact owner Gmail and is re-verified server-side', async () => {
  const [link, endpoint, nav, count] = await Promise.all([
    source('components/OwnerAdminReturnLink.js'),
    source('app/api/auth/admin/customer-access/route.js'),
    source('lib/Nav.jsx'),
    source('app/api/admin/user-count/route.js')
  ]);
  assert.match(link, /normalizeOwnerEmail\(accountEmail\) === CANONICAL_ADMIN_EMAIL/);
  assert.match(link, /if \(!isCanonicalOwner\) return null/);
  assert.match(link, />Admin Access<|: 'Admin Access'/);
  assert.match(endpoint, /verifiedEmail !== CANONICAL_ADMIN_EMAIL/);
  assert.match(endpoint, /result\.cookies\.set\(ADMIN_SESSION_COOKIE, token/);
  assert.match(nav, /<OwnerAdminReturnLink \/>/);
  assert.match(count, /getVerifiedAdmin\(request\)/);
  assert.match(count, /auth\.admin\.listUsers\(\{ page, perPage: PAGE_SIZE \}\)/);
});

test('landing sounds are disabled by default and all motion respects reduced-motion preferences', async () => {
  const [experience, styles] = await Promise.all([
    source('components/LandingWelcomeExperience.js'),
    source('app/landing-home-refresh.css')
  ]);
  assert.match(experience, /useState\(false\)/);
  assert.match(experience, /Sound effects: \{soundEnabled \? 'On' : 'Off'\}/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /cookieSparkFloat/);
  assert.match(styles, /amazonAffiliateSpot/);
});

test('owner admin/customer cookies are shared on owner entry and explicit customer sign-out clears both', async () => {
  const [adminSession, ownerPassword, customerSignout] = await Promise.all([
    source('app/api/auth/admin/session/route.js'),
    source('app/api/auth/admin/password/route.js'),
    source('app/api/auth/site-owner/signout/route.js')
  ]);
  assert.match(adminSession, /if \(token && token !== customerToken\)/);
  assert.match(ownerPassword, /response\.cookies\.set\(SITE_OWNER_SESSION_COOKIE, accessToken/);
  assert.match(ownerPassword, /response\.cookies\.set\(ADMIN_SESSION_COOKIE, accessToken/);
  assert.match(customerSignout, /response\.cookies\.set\(SITE_OWNER_SESSION_COOKIE, ''/);
  assert.match(customerSignout, /response\.cookies\.set\(ADMIN_SESSION_COOKIE, ''/);
});
