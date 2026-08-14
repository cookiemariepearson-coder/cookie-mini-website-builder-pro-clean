export const BROWSER_DRAFT_DISPLAY_NAME_FIELD = 'browserDraftDisplayName';
export const BROWSER_DRAFT_STORAGE_KEY_FIELD = 'browserDraftStorageKey';
export const BROWSER_DRAFT_PAGE_SIZE = 6;

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const clean = value => String(value || '').trim().replace(/\s+/g, ' ');

export function validateBrowserDraftName(value = '') {
  const name = clean(value);
  if (!name) return { ok: false, error: 'Enter a name for this browser draft.' };
  if (name.length > 80) return { ok: false, error: 'Use a draft name with 80 characters or fewer.' };
  if (/[\u0000-\u001f\u007f]/.test(name) || !/[\p{L}\p{N}]/u.test(name)) {
    return { ok: false, error: 'Use a draft name that includes at least one letter or number.' };
  }
  return { ok: true, name };
}

export function browserDraftDisplayName(item = {}) {
  const draft = isRecord(item.draft) ? item.draft : {};
  return clean(
    draft[BROWSER_DRAFT_DISPLAY_NAME_FIELD]
    || draft.businessName
    || draft.draftName
    || item.storageKey
    || 'Browser Draft'
  );
}

export function browserDraftSavedTime(item = {}) {
  if (!isRecord(item.draft)) return null;
  const timestamp = Date.parse(String(item.draft.updatedAt || ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function parseBrowserDraftIndex(raw = '') {
  if (!String(raw || '').trim()) return { ok: true, items: [], index: {}, error: '' };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      items: [],
      index: null,
      error: 'Browser draft backups could not be read. No backups were changed.'
    };
  }
  if (!isRecord(parsed)) {
    return {
      ok: false,
      items: [],
      index: null,
      error: 'Browser draft backups use an unsupported format. No backups were changed.'
    };
  }

  const entries = Object.entries(parsed);
  const index = Object.fromEntries(entries);
  const items = entries.map(([storageKey, draft]) => ({
    storageKey,
    draft,
    usable: isRecord(draft) && Boolean(clean(storageKey)) && storageKey.length <= 200,
    legacy: isRecord(draft) && !clean(draft[BROWSER_DRAFT_STORAGE_KEY_FIELD]),
    savedTime: isRecord(draft) && Number.isFinite(Date.parse(String(draft.updatedAt || '')))
      ? Date.parse(String(draft.updatedAt))
      : null
  }));
  return { ok: true, items, index, error: '' };
}

export function sortBrowserDrafts(items = [], order = 'newest') {
  const list = [...items];
  if (order === 'name') {
    return list.sort((left, right) => browserDraftDisplayName(left).localeCompare(
      browserDraftDisplayName(right),
      'en',
      { numeric: true, sensitivity: 'base' }
    ) || String(left.storageKey).localeCompare(String(right.storageKey)));
  }
  const direction = order === 'oldest' ? 1 : -1;
  return list.sort((left, right) => {
    const leftTime = browserDraftSavedTime(left);
    const rightTime = browserDraftSavedTime(right);
    if (leftTime === null && rightTime === null) return String(left.storageKey).localeCompare(String(right.storageKey));
    if (leftTime === null) return 1;
    if (rightTime === null) return -1;
    return (leftTime - rightTime) * direction || String(left.storageKey).localeCompare(String(right.storageKey));
  });
}

function requireReadableIndex(raw) {
  const parsed = parseBrowserDraftIndex(raw);
  if (!parsed.ok || !parsed.index) throw new Error(parsed.error || 'Browser draft backups could not be changed.');
  return parsed;
}

export function renameBrowserDraftInIndex(raw, storageKey, requestedName) {
  const validation = validateBrowserDraftName(requestedName);
  if (!validation.ok) throw new Error(validation.error);
  const parsed = requireReadableIndex(raw);
  if (!Object.hasOwn(parsed.index, storageKey) || !isRecord(parsed.index[storageKey])) {
    throw new Error('This browser draft could not be renamed. No backups were changed.');
  }
  const renamedDraft = {
    ...parsed.index[storageKey],
    [BROWSER_DRAFT_DISPLAY_NAME_FIELD]: validation.name
  };
  const nextIndex = Object.fromEntries(Object.entries(parsed.index).map(([key, draft]) => [
    key,
    key === storageKey ? renamedDraft : draft
  ]));
  return { serialized: JSON.stringify(nextIndex), name: validation.name, draft: renamedDraft };
}

export function deleteBrowserDraftsFromIndex(raw, storageKeys = []) {
  const parsed = requireReadableIndex(raw);
  const selected = new Set(storageKeys.map(String));
  const existingKeys = Object.keys(parsed.index);
  const removedKeys = existingKeys.filter(key => selected.has(key));
  const nextIndex = Object.fromEntries(Object.entries(parsed.index).filter(([key]) => !selected.has(key)));
  return {
    serialized: JSON.stringify(nextIndex),
    removedKeys,
    remainingCount: Object.keys(nextIndex).length
  };
}

export function prepareBrowserDraftForContinue(item = {}) {
  if (!item.usable || !isRecord(item.draft)) return null;
  return {
    ...item.draft,
    [BROWSER_DRAFT_STORAGE_KEY_FIELD]: String(item.storageKey)
  };
}

export function browserDraftStorageIdentity(draft = {}, currentStorageKey = '') {
  if (!isRecord(draft)) return clean(currentStorageKey);
  return clean(draft[BROWSER_DRAFT_STORAGE_KEY_FIELD] || currentStorageKey || draft.slug);
}

export function currentBrowserDraftMatches(draft, currentStorageKey, selectedStorageKeys = []) {
  const identity = browserDraftStorageIdentity(draft, currentStorageKey);
  return Boolean(identity && new Set(selectedStorageKeys.map(String)).has(identity));
}
