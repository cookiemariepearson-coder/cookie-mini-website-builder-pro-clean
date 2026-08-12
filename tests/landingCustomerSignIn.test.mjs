import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8'); }

test('landing navigation and hero expose one shared account control', async () => {
  const [nav, homepage, account] = await Promise.all([source('lib/Nav.jsx'), source('app/page.js'), source('components/CustomerAccountLink.js')]);
  assert.match(nav, /<CustomerAccountLink \/>/);
  assert.match(nav, /aria-label="Main navigation"/);
  assert.match(homepage, /<CustomerAccountLink placement="hero" \/>/);
  assert.match(account, /Customer Sign In/);
  assert.doesNotMatch(account, /href="\/customer\?mode=create"/);
});

test('shared modal provides create, password sign-in, recovery, and guest choices', async () => {
  const modal = await source('components/AccountModalProvider.js');
  for (const label of ['Create your free account', 'Welcome back', 'Set or reset your password', 'Continue as Guest', 'Set or Reset Password', 'Privacy Policy']) assert.match(modal, new RegExp(label.replace(/[?]/g, '\\?')));
  assert.match(modal, /Previously signed in with an email link\? Set your password here once\./);
  assert.match(modal, /autoComplete=\{mode === 'create' \? 'new-password' : 'current-password'\}/);
  assert.match(modal, /minLength=\{mode === 'create' \? 10/);
});

test('My Websites appears only after a server-verified session', async () => {
  const [account, provider] = await Promise.all([source('components/CustomerAccountLink.js'), source('components/AccountModalProvider.js')]);
  assert.match(provider, /fetch\('\/api\/auth\/site-owner\/session'/);
  assert.match(provider, /setAccountState\('signed-in'\)/);
  assert.match(account, /accountState === 'signed-in'/);
  assert.match(account, /href="\/customer">My Websites/);
});

test('account modal has focus containment, Escape close, inert background, touch sizing and reduced motion', async () => {
  const [modal, css] = await Promise.all([source('components/AccountModalProvider.js'), source('app/account-modal.css')]);
  assert.match(modal, /event\.key === 'Escape'/);
  assert.match(modal, /event\.key !== 'Tab'/);
  assert.match(modal, /triggerRef\.current\?\.focus/);
  assert.match(modal, /inert=\{open \? '' : undefined\}/);
  assert.match(modal, /role="dialog" aria-modal="true"/);
  assert.match(css, /width:46px;height:46px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('landing account destinations stay internal to Mini Builder', async () => {
  const [account, provider] = await Promise.all([source('components/CustomerAccountLink.js'), source('components/AccountModalProvider.js')]);
  assert.doesNotMatch(account, /connect\.cookiesdigitalcreations\.com/);
  assert.match(provider, /function safeDestination/);
  assert.match(provider, /return '\/customer'/);
  assert.doesNotMatch(provider, /window\.location\.assign\(options\.destination/);
});
