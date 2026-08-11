import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('landing navigation and hero expose the returning-customer account control', async () => {
  const [nav, homepage] = await Promise.all([
    source('lib/Nav.jsx'),
    source('app/page.js')
  ]);
  assert.match(nav, /<CustomerAccountLink \/>/);
  assert.match(nav, /aria-label="Main navigation"/);
  assert.match(homepage, /<CustomerAccountLink placement="hero" \/>/);
});

test('signed-out visitors see separate Sign In and Create Free Account choices', async () => {
  const account = await source('components/CustomerAccountLink.js');
  assert.match(account, />Sign In<\/Link>/);
  assert.match(account, />Create Free Account<\/Link>/);
  assert.match(account, /Already started a website\? Sign in to open your drafts\./);
  assert.match(account, /save your work permanently/);
  assert.match(account, /href="\/customer\?mode=signin"/);
  assert.match(account, /href="\/customer\?mode=create"/);
});

test('My Websites appears only after server verification of the saved session', async () => {
  const account = await source('components/CustomerAccountLink.js');
  assert.match(account, /fetch\('\/api\/auth\/site-owner\/session'/);
  assert.match(account, /Authorization: `Bearer \$\{token\}`/);
  assert.match(account, /if \(result\.ok\) \{\s*setAccountState\('signed-in'\)/);
  assert.match(account, /window\.localStorage\.removeItem\(AUTH_TOKEN_KEY\)/);
  assert.doesNotMatch(account, /email\s*===|customer_email|owner_id/);
});

test('account control has accessible feedback, focus styling, touch sizing, and a mobile layout', async () => {
  const [account, css] = await Promise.all([
    source('components/CustomerAccountLink.js'),
    source('app/globals.css')
  ]);
  assert.match(account, /role="status" aria-live="polite"/);
  assert.match(account, /aria-label="Sign In to the Mini Website Builder"/);
  assert.match(account, /aria-label="Create a free Mini Website Builder account"/);
  assert.match(css, /\.nav \.navAccountLink\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:760px\).*navAccountControl/s);
  assert.match(css, /min-height:48px/);
  assert.match(css, /:where\(a,button,input,select,textarea,summary\):focus-visible/);
});

test('landing account access stays on the Builder-owned customer route', async () => {
  const account = await source('components/CustomerAccountLink.js');
  assert.doesNotMatch(account, /connect\.cookiesdigitalcreations\.com/);
  assert.doesNotMatch(account, /returnTo|redirectTo|https?:\/\//);
  assert.match(account, /href="\/customer\?mode=signin"/);
  assert.match(account, /href="\/customer\?mode=create"/);
  assert.match(account, /href="\/customer"/);
});
