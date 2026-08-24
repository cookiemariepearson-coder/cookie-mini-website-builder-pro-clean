import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { planMatchesCheckoutAuthority, reconcileBuilderPlan } from '../lib/builderPlanAuthority.mjs';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Business checkout intent overrides a stale Free browser draft', () => {
  const result = reconcileBuilderPlan({ plan: 'free', pages: ['Home'], customerActions: [] }, 'business');
  assert.equal(result.plan, 'business');
  assert.equal(result.site.plan, 'business');
  assert.equal(result.source, 'checkout-intent');
});

test('Premium checkout intent overrides stale saved draft state', () => {
  const result = reconcileBuilderPlan({ plan: 'free', pages: ['Home', 'About'] }, 'premium');
  assert.equal(result.site.plan, 'premium');
  assert.equal(planMatchesCheckoutAuthority(result.site.plan, 'premium'), true);
  assert.equal(planMatchesCheckoutAuthority('free', 'premium'), false);
});

test('saved paid plan survives refresh and reopen without a checkout intent', () => {
  assert.equal(reconcileBuilderPlan({ plan: 'business', pages: ['Home'] }).site.plan, 'business');
  assert.equal(reconcileBuilderPlan({ plan: 'premium', pages: ['Home'] }).site.plan, 'premium');
});

test('Builder waits for plan reconciliation before editing or autosave', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /const \[builderReady, setBuilderReady\] = useState\(false\)/);
  assert.match(builder, /if \(!builderReady\) return;/);
  assert.match(builder, /Opening your website plan/);
  assert.match(builder, /disabled=\{Boolean\(authoritativeCheckoutPlan\)\}/);
});

test('all five Builder navigation steps preserve the reconciled site object', async () => {
  const builder = await source('app/builder/page.js');
  assert.match(builder, /\['Choose Type & Look','Website Info','Design','Sections & Wording','Preview & Publish'\]/);
  assert.match(builder, /function next\(\) \{ persistLocal\('Draft saved\.'\); setStep/);
  assert.match(builder, /function back\(\) \{ persistLocal\('Draft saved\.'\); setStep/);
  assert.match(builder, /planMatchesCheckoutAuthority\(site\.plan, authoritativeCheckoutPlan\)/);
});

test('Business and Premium prices remain exact at Preview and checkout', async () => {
  const defaults = await source('lib/siteDefaults.js');
  assert.match(defaults, /business:\s*\{[^}]*price:\s*'\$30\/mo'/s);
  assert.match(defaults, /premium:\s*\{[^}]*price:\s*'\$50\/mo'/s);
});

test('desktop and tablet side-by-side preview stays sticky with internal scrolling', async () => {
  const css = await source('app/globals.css');
  assert.match(css, /Persistent Live Draft Preview/);
  assert.match(css, /\.previewSticky\{top:16px;align-self:start;max-height:calc\(100dvh - 32px\);overflow:auto/);
  assert.match(css, /@media\(min-width:981px\)\{html:has\(\.builderShell\),body:has\(\.builderShell\)\{overflow-x:clip;overflow-y:visible\}\.builderMain\{overflow:visible\}\}/);
  assert.match(css, /@media\(min-width:981px\) and \(max-width:1100px\)\{\.builderTwoCol\{grid-template-columns:1fr 1fr\}\.previewSticky\{position:sticky/);
  assert.match(css, /@media\(max-width:980px\)\{\.builderTwoCol\{grid-template-columns:1fr\}\.previewSticky\{position:static/);
});

test('customer-facing Builder source contains no repair-history language', async () => {
  const customerSources = await Promise.all([
    'app/builder/page.js',
    'app/pricing/page.js',
    'app/customer/page.js',
    'app/checkout/continue/page.js'
  ].map(source));
  const renderedText = customerSources.join('\n').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(renderedText, /\b(?:bug fix|hotfix|production repair|recovery work|regression test|deployment status|implementation detail|diagnostic mode)\b/i);
});
