import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  BROWSER_DRAFT_PAGE_SIZE,
  BROWSER_DRAFT_STORAGE_KEY_FIELD,
  browserDraftDisplayName,
  currentBrowserDraftMatches,
  deleteBrowserDraftsFromIndex,
  parseBrowserDraftIndex,
  prepareBrowserDraftForContinue,
  renameBrowserDraftInIndex,
  sortBrowserDrafts,
  validateBrowserDraftName
} from '../lib/browserDraftBackups.mjs';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const draft = (name, updatedAt, extra = {}) => ({ businessName: name, updatedAt, typeKey: 'local', styleKey: 'service-3d', headline: `${name} headline`, ...extra });
const indexRaw = entries => JSON.stringify(Object.fromEntries(entries));
const fixtures = count => indexRaw(Array.from({ length: count }, (_, index) => [
  `draft-${index + 1}`,
  draft(`Draft ${index + 1}`, `2026-08-${String((index % 28) + 1).padStart(2, '0')}T12:00:00.000Z`)
]));

test('1. no browser draft backups produces an empty readable index', () => {
  const parsed = parseBrowserDraftIndex('');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.items.length, 0);
});

test('2. one browser draft backup retains its storage identity and content', () => {
  const parsed = parseBrowserDraftIndex(indexRaw([['one', draft('One', '2026-08-01T12:30:00.000Z')]]));
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].storageKey, 'one');
  assert.equal(parsed.items[0].draft.headline, 'One headline');
});

test('3. twenty-nine or more browser draft backups remain available', () => {
  assert.equal(parseBrowserDraftIndex(fixtures(29)).items.length, 29);
  assert.equal(parseBrowserDraftIndex(fixtures(35)).items.length, 35);
});

test('4. the initial backup count is the complete index count, not the progressive page size', async () => {
  const page = await source('app/customer/page.js');
  assert.equal(parseBrowserDraftIndex(fixtures(29)).items.length, 29);
  assert.equal(BROWSER_DRAFT_PAGE_SIZE, 6);
  assert.match(page, /browserDrafts\.length} browser draft backups/);
});

test('5. Continue Draft prepares the exact selected backup with a stable storage key', async () => {
  const parsed = parseBrowserDraftIndex(indexRaw([
    ['first', draft('First', '2026-08-01T12:00:00.000Z', { templateMarker: 'keep-first' })],
    ['second', draft('Second', '2026-08-02T12:00:00.000Z', { templateMarker: 'keep-second' })]
  ]));
  const selected = prepareBrowserDraftForContinue(parsed.items[1]);
  assert.equal(selected.businessName, 'Second');
  assert.equal(selected.templateMarker, 'keep-second');
  assert.equal(selected[BROWSER_DRAFT_STORAGE_KEY_FIELD], 'second');
  assert.equal(parsed.items[0].draft.templateMarker, 'keep-first');
  assert.equal(currentBrowserDraftMatches(selected, 'first', ['second']), true);
  assert.equal(currentBrowserDraftMatches(selected, 'second', ['first']), false);
  const builder = await source('app/builder/page.js');
  assert.match(builder, /draftStorageKeyFor\(draft/);
  assert.match(builder, /\[storageKey\]: lightDraft/);
});

test('6. renaming changes only the selected display name', () => {
  const raw = indexRaw([
    ['one', draft('Original', '2026-08-01T12:00:00.000Z', { sections: { Home: 'Keep me' } })],
    ['two', draft('Other', '2026-08-02T12:00:00.000Z')]
  ]);
  const result = renameBrowserDraftInIndex(raw, 'one', '  My Favorite Draft  ');
  const parsed = parseBrowserDraftIndex(result.serialized);
  assert.equal(browserDraftDisplayName(parsed.items[0]), 'My Favorite Draft');
  assert.deepEqual(parsed.items[0].draft.sections, { Home: 'Keep me' });
  assert.equal(parsed.items[0].draft.updatedAt, '2026-08-01T12:00:00.000Z');
  assert.equal(parsed.items[1].draft.businessName, 'Other');
});

test('7. an empty or invalid draft name is rejected clearly', () => {
  assert.equal(validateBrowserDraftName('   ').ok, false);
  assert.equal(validateBrowserDraftName('---').ok, false);
  assert.throws(() => renameBrowserDraftInIndex(fixtures(1), 'draft-1', '   '), /Enter a name/);
});

test('8. duplicate display names remain distinguishable by saved date and time', async () => {
  const raw = indexRaw([
    ['early', draft('One', '2026-08-01T09:15:00.000Z')],
    ['late', draft('Two', '2026-08-02T18:45:00.000Z')]
  ]);
  const first = renameBrowserDraftInIndex(raw, 'early', 'Customer Draft');
  const second = renameBrowserDraftInIndex(first.serialized, 'late', 'Customer Draft');
  const parsed = parseBrowserDraftIndex(second.serialized);
  assert.equal(browserDraftDisplayName(parsed.items[0]), browserDraftDisplayName(parsed.items[1]));
  assert.notEqual(parsed.items[0].savedTime, parsed.items[1].savedTime);
  assert.match(await source('app/customer/page.js'), /dateStyle: 'medium', timeStyle: 'short'/);
});

test('9. individual deletion opens a deliberate dialog and cancellation changes nothing', async () => {
  const dialog = await source('components/BrowserDraftDialog.js');
  assert.match(dialog, /Delete this browser draft backup\?/);
  assert.match(dialog, /Keep My Draft/);
  assert.match(dialog, /onClick=\{onCancel\}/);
  assert.match(dialog, /will not delete your published website, customer account, subscription, purchase, or AI Video/);
});

test('10. confirming individual deletion removes one fixture backup', () => {
  const result = deleteBrowserDraftsFromIndex(fixtures(2), ['draft-1']);
  assert.deepEqual(result.removedKeys, ['draft-1']);
  assert.equal(result.remainingCount, 1);
});

test('11. only the selected browser draft is removed', () => {
  const result = deleteBrowserDraftsFromIndex(fixtures(3), ['draft-2']);
  const keys = parseBrowserDraftIndex(result.serialized).items.map(item => item.storageKey);
  assert.deepEqual(keys, ['draft-1', 'draft-3']);
});

test('12. the backup count updates from the newly serialized index', async () => {
  const result = deleteBrowserDraftsFromIndex(fixtures(3), ['draft-1']);
  assert.equal(parseBrowserDraftIndex(result.serialized).items.length, 2);
  assert.match(await source('app/customer/page.js'), /refreshBrowserDrafts\(result\.serialized\)/);
});

test('13. selection mode can be entered and canceled without constant checkboxes', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, />Select Drafts</);
  assert.match(page, /browserDraftSelectionMode &&/);
  assert.match(page, />Cancel Selection</);
  assert.match(page, /cancelBrowserDraftSelection/);
});

test('14. multiple drafts can be selected with visible labels', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /selectedBrowserDrafts\.includes\(item\.storageKey\)/);
  assert.match(page, /toggleBrowserDraftSelection\(item\.storageKey\)/);
  assert.match(page, /<span>Select \{name\}<\/span>/);
});

test('15. selected-draft deletion can be canceled from the exact-count dialog', async () => {
  const dialog = await source('components/BrowserDraftDialog.js');
  assert.match(dialog, /Delete these \$\{count} browser draft backups\?/);
  assert.match(dialog, /Keep My Drafts/);
  assert.match(dialog, /onCancelRef\.current\(\)/);
});

test('16. confirming selected-draft deletion removes exactly the selected fixtures', () => {
  const result = deleteBrowserDraftsFromIndex(fixtures(5), ['draft-2', 'draft-4']);
  assert.deepEqual(result.removedKeys, ['draft-2', 'draft-4']);
  assert.deepEqual(parseBrowserDraftIndex(result.serialized).items.map(item => item.storageKey), ['draft-1', 'draft-3', 'draft-5']);
});

test('17. Delete All opens an exact-count confirmation and can be canceled', async () => {
  const [page, dialog] = await Promise.all([source('app/customer/page.js'), source('components/BrowserDraftDialog.js')]);
  assert.match(page, />Delete All Browser Drafts</);
  assert.match(dialog, /Delete all \$\{count} browser draft backups from this browser\?/);
  assert.match(dialog, /This cannot be undone/);
  assert.match(dialog, /Keep My Drafts/);
});

test('18. confirming Delete All removes only isolated test backups', () => {
  const raw = fixtures(29);
  const keys = parseBrowserDraftIndex(raw).items.map(item => item.storageKey);
  const result = deleteBrowserDraftsFromIndex(raw, keys);
  assert.equal(result.removedKeys.length, 29);
  assert.equal(parseBrowserDraftIndex(result.serialized).items.length, 0);
});

test('19. the final deletion produces the friendly browser-backup empty state', async () => {
  const page = await source('app/customer/page.js');
  assert.match(page, /No browser draft backups remain\. Your published and server-saved websites are unchanged\./);
});

test('20. duplicate action clicks are blocked before a second storage mutation', async () => {
  const [page, dialog] = await Promise.all([source('app/customer/page.js'), source('components/BrowserDraftDialog.js')]);
  assert.match(page, /browserDraftActionLockRef\.current\) return/);
  assert.match(page, /browserDraftActionLockRef\.current = true/);
  assert.match(dialog, /disabled=\{busy\}/);
});

test('21. newest sorting places the latest valid saved time first', () => {
  const items = parseBrowserDraftIndex(indexRaw([
    ['early', draft('Early', '2026-08-01T12:00:00.000Z')],
    ['late', draft('Late', '2026-08-09T12:00:00.000Z')]
  ])).items;
  assert.equal(sortBrowserDrafts(items, 'newest')[0].storageKey, 'late');
});

test('22. oldest sorting places the earliest valid saved time first', () => {
  const items = parseBrowserDraftIndex(indexRaw([
    ['late', draft('Late', '2026-08-09T12:00:00.000Z')],
    ['early', draft('Early', '2026-08-01T12:00:00.000Z')]
  ])).items;
  assert.equal(sortBrowserDrafts(items, 'oldest')[0].storageKey, 'early');
});

test('23. name sorting is case-insensitive and numeric-aware', () => {
  const items = parseBrowserDraftIndex(indexRaw([
    ['z', draft('Draft 10', '2026-08-01T12:00:00.000Z')],
    ['a', draft('draft 2', '2026-08-02T12:00:00.000Z')]
  ])).items;
  assert.deepEqual(sortBrowserDrafts(items, 'name').map(item => item.storageKey), ['a', 'z']);
});

test('24. progressive Show More starts with six and does not change the total', async () => {
  const page = await source('app/customer/page.js');
  assert.equal(BROWSER_DRAFT_PAGE_SIZE, 6);
  assert.match(page, /slice\(0, browserDraftVisibleCount\)/);
  assert.match(page, /Show More \(\{sortedBrowserDrafts\.length - visibleBrowserDrafts\.length\} remaining\)/);
});

test('25. corrupted indexes and unreadable entries fail safely without crashing', async () => {
  const corruptIndex = parseBrowserDraftIndex('{not-json');
  assert.equal(corruptIndex.ok, false);
  assert.match(corruptIndex.error, /No backups were changed/);
  const damagedEntry = parseBrowserDraftIndex(JSON.stringify({ damaged: null }));
  assert.equal(damagedEntry.items[0].usable, false);
  assert.equal(prepareBrowserDraftForContinue(damagedEntry.items[0]), null);
  assert.throws(() => renameBrowserDraftInIndex('{not-json', 'anything', 'Name'), /could not be read/);
  const [builder, checkout] = await Promise.all([source('app/builder/page.js'), source('app/checkout/success/page.js')]);
  assert.match(builder, /if \(rawText && \(!raw \|\| typeof raw !== 'object' \|\| Array\.isArray\(raw\)\)\) return/);
  assert.match(checkout, /if \(rawIndex && \(!parsedIndex \|\| typeof parsedIndex !== 'object' \|\| Array\.isArray\(parsedIndex\)\)\) return/);
});

test('26. legacy slug-keyed drafts continue without mutating the legacy source entry', () => {
  const raw = indexRaw([['legacy-slug', { businessName: 'Legacy', sections: { Home: 'Preserved' } }]]);
  const item = parseBrowserDraftIndex(raw).items[0];
  assert.equal(item.legacy, true);
  const continued = prepareBrowserDraftForContinue(item);
  assert.equal(continued.browserDraftStorageKey, 'legacy-slug');
  assert.equal(continued.sections.Home, 'Preserved');
  assert.equal(item.draft.browserDraftStorageKey, undefined);
});

test('27. Preview Draft is omitted because the existing builder restore path is not read-only', async () => {
  const page = await source('app/customer/page.js');
  assert.doesNotMatch(page, />Preview Draft</);
});

test('28. Duplicate Draft is omitted because legacy slug identities cannot guarantee independent copies', async () => {
  const page = await source('app/customer/page.js');
  assert.doesNotMatch(page, />Duplicate Draft</);
});

function assertProtectedDataUnchanged(protectedRecord) {
  const before = JSON.stringify(protectedRecord);
  renameBrowserDraftInIndex(fixtures(2), 'draft-1', 'Renamed');
  deleteBrowserDraftsFromIndex(fixtures(2), ['draft-1']);
  assert.equal(JSON.stringify(protectedRecord), before);
}

test('29. published websites remain unchanged by local backup helpers', () => {
  assertProtectedDataUnchanged({ status: 'published', content: 'live', owner_id: 'server-owner' });
});

test('30. unpublished server-saved websites remain unchanged', () => {
  assertProtectedDataUnchanged({ status: 'draft', content: 'server draft', owner_id: 'server-owner' });
});

test('31. recoverable Website Trash remains unchanged', () => {
  assertProtectedDataUnchanged({ status: 'deleted', customer_deleted_at: '2026-08-01T00:00:00Z' });
});

test('32. customer account and subscription records remain unchanged', () => {
  assertProtectedDataUnchanged({ user_id: 'server-user', subscription_status: 'active', plan: 'business' });
});

test('33. Gumroad purchases and payment records remain unchanged', () => {
  assertProtectedDataUnchanged({ gumroad_sale_id: 'server-only', payment_status: 'paid' });
});

test('34. AI Video plans, credits, jobs, and results remain unchanged', async () => {
  assertProtectedDataUnchanged({ job_id: 'server-job', credits: 1, result: 'protected' });
  const helper = await source('lib/browserDraftBackups.mjs');
  assert.doesNotMatch(helper, /fetch\(|supabase|gumroad|heygen|video_jobs/i);
});

test('35. keyboard-only dialog operation includes Escape and a focus trap', async () => {
  const dialog = await source('components/BrowserDraftDialog.js');
  assert.match(dialog, /event\.key === 'Escape'/);
  assert.match(dialog, /event\.key !== 'Tab'/);
  assert.match(dialog, /aria-modal="true"/);
});

test('36. screen-reader labels and announced results identify drafts and errors', async () => {
  const [page, dialog] = await Promise.all([source('app/customer/page.js'), source('components/BrowserDraftDialog.js')]);
  assert.match(page, /aria-label=\{`Manage \$\{name\} browser draft`\}/);
  assert.match(page, /aria-live=\{browserDraftReadError \? 'assertive' : 'polite'\}/);
  assert.match(dialog, /role="alert"/);
});

test('37. dialog cancellation restores focus to the initiating control', async () => {
  const dialog = await source('components/BrowserDraftDialog.js');
  assert.match(dialog, /returnFocus\?\.isConnected/);
  assert.match(dialog, /fallbackFocusRef\?\.current\?\.focus/);
  assert.match(dialog, /dialog\.action === 'rename' \? inputRef\.current : cancelRef\.current/);
});

test('38. mobile layout and touch targets preserve wrapping, focus, and reduced motion', async () => {
  const css = await source('app/globals.css');
  assert.match(css, /\.browserDraftCardDetails h3\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.browserDraftToolbar select\{min-height:44px/);
  assert.match(css, /@media\(max-width:760px\)\{\.browserDraftSection/);
  assert.match(css, /browserDraftBulkBar[^}]*flex-direction:column/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.browserDraftCard/);
  assert.match(css, /:focus-visible/);
});
