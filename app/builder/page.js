'use client';

import { Children, cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import SitePreview from '../../lib/SitePreview.js';
import { createDefaultSite, templateLibrary, getTemplate, pageOptions, plans, slugify, sectionPrompts, normalizeSelectedPagesForPlan, planAllowsMedia, planAllowsAiVideo, planSectionLimit, customerActionLimit, customerActionTypes, normalizeCustomerActions } from '../../lib/siteDefaults';
import { PENDING_CHECKOUT_STORAGE_KEY, createPendingCheckoutIntent, websiteCheckoutRoute } from '../../lib/commerceConfig.mjs';
import { useAccountModal } from '../../components/AccountModalProvider';

const DRAFT_KEY = 'cookieDraftSite';
const LAST_STEP_KEY = 'cookieBuilderStep';
const CURRENT_DRAFT_SLUG_KEY = 'cookieBuilderCurrentSlug';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';
const AUTH_TOKEN_KEY = 'cookieSiteOwnerAccessToken';
const GUEST_CLAIM_KEY = 'cookieGuestDraftClaimV1';

function ownerAccessToken() {
  try { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch { return ''; }
}

function ownerAuthHeaders() {
  const token = ownerAccessToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function normalizeSlug(input = '') {
  let value = String(input || '').trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
  value = value.split('/')[0].split('?')[0].split('#')[0];
  const root = 'cookiesdigitalcreations.com';
  if (value.endsWith('.' + root)) value = value.slice(0, -1 * (root.length + 1));
  if (value === root) value = '';
  return slugify(value);
}

function nowStamp() {
  return new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function safeUploadName(value = '') {
  return (String(value || '').split(/[\\/]/).pop() || 'Uploaded image')
    .replace(/[\u0000-\u001f\u007f<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'Uploaded image';
}

function draftSlugFor(draft = {}) {
  const savedSlug = slugify(draft.slug || '');
  const placeholderSlugs = new Set(['my-website', 'my-business-name', 'published-website']);
  if (savedSlug && !placeholderSlugs.has(savedSlug)) return savedSlug;
  return slugify(draft.draftName || draft.businessName || 'my-website');
}


function saveLocalDraftIndex(draft) {
  try {
    const slug = draftSlugFor(draft);
    const raw = safeParse(localStorage.getItem(DRAFTS_INDEX_KEY)) || {};
    const lightDraft = stripHeavyLocalData({ ...draft, slug, updatedAt: new Date().toISOString() });
    raw[slug] = lightDraft;
    localStorage.setItem(DRAFTS_INDEX_KEY, JSON.stringify(raw));
  } catch {}
}

function stripHeavyLocalData(draft) {
  // Keep local autosave light so big uploaded images do not freeze the builder.
  // Online Save Draft/Publish still sends the full site data.
  return {
    ...draft,
    heroImage: draft?.heroImage?.startsWith?.('data:image') ? '' : draft.heroImage,
    media: Array.isArray(draft?.media)
      ? draft.media.map(item => item?.kind === 'image' && String(item.url || '').startsWith('data:image') ? { ...item, url: '', localImageRemoved: true } : item)
      : []
  };
}

function stylePreset(styleKey = '') {
  if (styleKey.includes('cartoon') || styleKey.includes('color-pop')) return { layoutStyle: 'centered', fontStyle: 'playful', backgroundStyle: 'pattern', sectionShape: 'floating' };
  if (styleKey.includes('luxury') || styleKey.includes('glam') || styleKey.includes('advisor') || styleKey.includes('product')) return { layoutStyle: 'split', fontStyle: 'elegant', backgroundStyle: 'dark', sectionShape: 'floating' };
  if (styleKey.includes('clean') || styleKey.includes('minimal') || styleKey.includes('expert')) return { layoutStyle: 'centered', fontStyle: 'clean', backgroundStyle: 'soft', sectionShape: 'cards' };
  if (styleKey.includes('realistic') || styleKey.includes('building') || styleKey.includes('storefront')) return { layoutStyle: 'visual-first', fontStyle: 'clean', backgroundStyle: 'gradient', sectionShape: 'boxed' };
  return { layoutStyle: 'split', fontStyle: 'bold', backgroundStyle: 'gradient', sectionShape: 'cards' };
}

function mergeDefaults(saved) {
  const base = createDefaultSite({ typeKey: saved?.typeKey || 'local', styleKey: saved?.styleKey });
  return {
    ...base,
    ...saved,
    sections: { ...base.sections, ...(saved?.sections || {}) },
    offers: Array.isArray(saved?.offers) && saved.offers.length ? saved.offers : base.offers,
    media: Array.isArray(saved?.media) ? saved.media : [],
    customerActions: Array.isArray(saved?.customerActions) && saved.customerActions.length ? normalizeCustomerActions(saved.customerActions, saved?.plan || base.plan) : base.customerActions,
    pages: normalizeSelectedPagesForPlan(Array.isArray(saved?.pages) && saved.pages.length ? saved.pages : base.pages, saved?.plan || base.plan, saved?.extraPages || saved?.extra_pages),
    desiredPages: Array.isArray(saved?.desiredPages) && saved.desiredPages.length ? saved.desiredPages : base.desiredPages
  };
}

function getStyle(typeKey, styleKey) {
  const type = templateLibrary.find(t => t.key === typeKey) || templateLibrary[0];
  return type.styles.find(s => s.key === styleKey) || type.styles[0];
}

async function compressImage(file, maxSize = 900, quality = 0.68) {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!file || !allowedTypes.has(file.type)) throw new Error('Upload a JPEG, PNG, or WebP image. SVG, GIF, video, and other files are not supported.');
  if (file.size > 8 * 1024 * 1024) throw new Error('That image is larger than 8 MB. Choose a smaller image.');
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  if (!img.width || !img.height || img.width > 6000 || img.height > 6000 || img.width * img.height > 24000000) {
    throw new Error('That image has dimensions that are too large. Use an image no larger than 6000 pixels per side and 24 megapixels.');
  }
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function Builder() {
  const { accountState, openAccountModal } = useAccountModal();
  const [step, setStep] = useState(0);
  const [site, setSite] = useState(() => createDefaultSite());
  const [message, setMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showCurrentDraft, setShowCurrentDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isSmallBuilderScreen, setIsSmallBuilderScreen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState('');
  const [pendingCheckoutIntent, setPendingCheckoutIntent] = useState('');
  const [resumeCheckoutRequested, setResumeCheckoutRequested] = useState(false);
  const [checkoutBusyPlan, setCheckoutBusyPlan] = useState('');
  const [checkoutRetryPlan, setCheckoutRetryPlan] = useState('');
  const [hasOwnerSession, setHasOwnerSession] = useState(false);
  const checkoutBusyRef = useRef(false);
  const tmpl = useMemo(() => getTemplate(site.typeKey, site.styleKey), [site.typeKey, site.styleKey]);

  useEffect(() => { setHasOwnerSession(accountState === 'signed-in'); }, [accountState]);

  useEffect(() => {
    async function restore() {
      const params = new URLSearchParams(window.location.search);
      let requestedCheckout = websiteCheckoutRoute(params.get('checkout')) ? params.get('checkout') : '';
      let checkoutIntentId = params.get('checkoutIntent') || '';
      let intentDraftSlug = '';
      const shouldResumeCheckout = params.get('resumeCheckout') === '1';
      if (checkoutIntentId) {
        try {
          const token = ownerAccessToken();
          const response = await fetch(`/api/checkout/intent/status?id=${encodeURIComponent(checkoutIntentId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const intent = await response.json();
          if (!intent.ok) {
            setMessage(intent.error || 'This secure checkout continuation could not be loaded.');
            return;
          }
          requestedCheckout = intent.plan;
          intentDraftSlug = intent.draftSlug || '';
          setPendingCheckoutIntent(intent.intentId);
          setResumeCheckoutRequested(shouldResumeCheckout);
        } catch {
          setMessage('This secure checkout continuation could not be loaded. Your draft is still safe.');
          return;
        }
      } else if (requestedCheckout) {
        try {
          const draftFromUrl = normalizeSlug(params.get('draft') || '');
          const response = await fetch('/api/checkout/intent/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: requestedCheckout, draftSlug: draftFromUrl })
          });
          const intent = await response.json();
          if (!intent.ok) {
            setMessage(intent.error || 'Secure checkout could not start. Your draft is still safe.');
            return;
          }
          checkoutIntentId = intent.intentId;
          setPendingCheckoutIntent(intent.intentId);
          const nextParams = new URLSearchParams({ checkoutIntent: intent.intentId });
          if (draftFromUrl) nextParams.set('draft', draftFromUrl);
          window.history.replaceState({}, document.title, `/builder?${nextParams.toString()}`);
        } catch {
          setMessage('Secure checkout could not start. Your draft is still safe.');
          return;
        }
      }
      const requestedPlan = requestedCheckout && requestedCheckout !== 'extra' ? requestedCheckout : '';
      if (requestedCheckout) setPendingCheckout(requestedCheckout);
      const draftSlug = normalizeSlug(intentDraftSlug || params.get('draft') || params.get('slug') || '');
      if (draftSlug && draftSlug !== 'my-website') {
        setSaveMessage('Opening saved draft...');
        try {
          const res = await fetch(`/api/site/get?slug=${encodeURIComponent(draftSlug)}&owner=1`, {
            headers: ownerAuthHeaders()
          });
          const data = await res.json();
          if (data.ok && data.site) {
            const merged = mergeDefaults({ ...data.site, ...(requestedPlan ? { plan: requestedPlan } : {}) });
            setSite(merged);
            localStorage.setItem(DRAFT_KEY, JSON.stringify(merged));
            localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draftSlugFor(merged));
            setStep(1);
            setSaveMessage('Saved website/draft opened. Continue editing, then save or publish.');
            return;
          }
          setSaveMessage(data.error || 'Could not open that saved draft. Restoring browser draft instead.');
        } catch (e) {
          setSaveMessage(`Could not open online draft: ${e.message}`);
        }
      }
      const saved = safeParse(localStorage.getItem(DRAFT_KEY));
      const savedStep = Number(localStorage.getItem(LAST_STEP_KEY || 0));
      if (saved) {
        setSite(mergeDefaults({ ...saved, ...(requestedPlan ? { plan: requestedPlan } : {}) }));
        localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draftSlugFor(saved));
        if (!Number.isNaN(savedStep)) setStep(Math.min(4, Math.max(0, savedStep)));
        setSaveMessage('Draft restored from this browser.');
      } else if (requestedPlan) {
        setSite(current => mergeDefaults({ ...current, plan: requestedPlan }));
      }
    }
    restore();
  }, []);

  useEffect(() => {
    if (!resumeCheckoutRequested || !pendingCheckout || !pendingCheckoutIntent || (pendingCheckout !== 'extra' && site.plan !== pendingCheckout) || !hasOwnerSession) return;
    const intentId = pendingCheckoutIntent;
    setPendingCheckout('');
    setResumeCheckoutRequested(false);
    setMessage(`Email verified. Continuing to the ${pendingCheckout === 'extra' ? 'Extra Page Add-On' : (plans[pendingCheckout]?.label || 'selected plan')} checkout...`);
    if (pendingCheckout === 'extra') checkoutExtraPage(intentId);
    else checkoutPlan(intentId);
    // checkoutPlan saves the verified owner's draft before opening checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCheckout, pendingCheckoutIntent, resumeCheckoutRequested, site.plan, hasOwnerSession]);

  useEffect(() => {
    function checkSize() {
      setIsSmallBuilderScreen(window.innerWidth <= 980);
    }
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    const keepVisible = /saving|opening|preparing|could not|failed|error|trouble/i.test(saveMessage);
    if (keepVisible) return;
    const handle = setTimeout(() => setSaveMessage(''), 4500);
    return () => clearTimeout(handle);
  }, [saveMessage]);

  useEffect(() => {
    const handle = setTimeout(() => setShowCurrentDraft(false), 4500);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    // Slower, lightweight autosave keeps the builder from freezing while typing or uploading images.
    const handle = setTimeout(() => {
      const localDraft = persistLocal('Draft auto-saved.', true);
      if (!hasOwnerSession && localDraft) void syncGuestDraftClaim(localDraft, true);
    }, 13000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, step, hasOwnerSession]);

  useEffect(() => {
    // No browser "Leave site?" popup. The builder already saves local drafts
    // and Save Draft / checkout save the draft online before moving pages.
    // This prevents customer confusion after they already clicked Save Draft.
  }, [site, step]);

  function update(patch) {
    setSite(current => ({
      ...current,
      ...patch,
      sections: patch.sections ? { ...(current.sections || {}), ...(patch.sections || {}) } : current.sections,
      media: patch.media || current.media
    }));
  }

  function updateSection(name, value) {
    setSite(current => ({ ...current, sections: { ...(current.sections || {}), [name]: value } }));
  }

  function updateCustomerActions(actions) {
    setSite(current => ({ ...current, customerActions: normalizeCustomerActions(actions, current.plan) }));
  }

  function updateDesign(patch) {
    setSite(current => ({ ...current, ...patch, designUpdatedAt: Date.now() }));
  }

  function chooseType(key) {
    const type = templateLibrary.find(t => t.key === key) || templateLibrary[0];
    const ns = createDefaultSite({ typeKey: key, styleKey: type.styles[0].key });
    const style = type.styles[0];
    const palette = style.palette || {};
    const preset = stylePreset(style.key);
    setSite(current => {
      const previousDefault = createDefaultSite({ typeKey: current.typeKey || 'local', styleKey: current.styleKey });
      const hasCustomBusinessName = Boolean(current.businessName && current.businessName !== 'My Business Name' && current.businessName !== previousDefault.businessName);
      const hasCustomHeadline = Boolean(current.headline && current.headline !== 'A beautiful website created in minutes.' && current.headline !== previousDefault.headline);
      const hasCustomDescription = Boolean(current.description && current.description !== 'Add your business details, services, products, and contact information so customers know what you offer.' && current.description !== previousDefault.description);
      return mergeDefaults({
      ...ns,
      businessName: hasCustomBusinessName ? current.businessName : ns.businessName,
      customerEmail: current.customerEmail,
      phone: current.phone,
      plan: current.plan,
      headline: hasCustomHeadline ? current.headline : ns.headline,
      description: hasCustomDescription ? current.description : ns.description,
      heroImage: current.heroImage,
      heroMediaLink: current.heroMediaLink,
      media: current.media || [],
      customerActions: ns.customerActions,
      ...preset,
      primaryColor: palette.primary || current.primaryColor,
      accentColor: palette.accent || current.accentColor,
      pages: normalizeSelectedPagesForPlan(type.pages || ['Home'], current.plan, current.extraPages || current.extra_pages),
      desiredPages: type.pages,
      offerTitle: ns.offerTitle,
      offers: ns.offers,
      sections: ns.sections,
      designUpdatedAt: Date.now()
    });
    });
    setMessage('Website type changed. Your selected sections were kept. Go to Sections & Wording to pick your own sections and add Order / Book / Buy buttons.');
  }

  function selectStyle(key) {
    const style = getStyle(site.typeKey, key);
    const preset = stylePreset(key);
    setSite(current => ({
      ...current,
      styleKey: key,
      ...preset,
      primaryColor: style.palette?.primary || current.primaryColor,
      accentColor: style.palette?.accent || current.accentColor,
      templateAppliedAt: Date.now(),
      designUpdatedAt: Date.now()
    }));
    setMessage(`Template look changed to ${style.name}. Layout, background, font feel, and card style were updated too.`);
  }

  function planLimit() { return planSectionLimit(site.plan, site.extraPages || site.extra_pages); }

  function addPage(page) {
    if (site.pages.includes(page)) return;
    const limit = planLimit();
    if (site.pages.length >= limit && site.plan !== 'premium') {
      setMessage(`${plans[site.plan]?.label} includes ${limit} selected section(s). Extra sections/pages are $10/month each. Sending you to the add-on checkout.`);
      persistLocal('Draft saved before extra page checkout.');
      setTimeout(() => { checkoutExtraPage(); }, 550);
      return;
    }
    update({ pages: normalizeSelectedPagesForPlan([...site.pages, page], site.plan, site.extraPages || site.extra_pages) });
  }

  function removePage(page) {
    if (page === 'Home') return;
    update({ pages: site.pages.filter(p => p !== page) });
  }

  function addOrderBookBuySection() {
    setSite(current => {
      const sectionName = 'Order / Book / Buy';
      let pages = normalizeSelectedPagesForPlan(current.pages || ['Home'], current.plan, current.extraPages || current.extra_pages);
      if (pages.includes(sectionName)) return current;

      const limit = planSectionLimit(current.plan, current.extraPages || current.extra_pages);
      let nextPages = [...pages];
      let removedPage = '';

      if (limit < 99 && nextPages.length >= limit) {
        for (let i = nextPages.length - 1; i >= 0; i -= 1) {
          if (nextPages[i] !== 'Home') {
            removedPage = nextPages[i];
            nextPages.splice(i, 1);
            break;
          }
        }
      }

      if (limit < 99 && nextPages.length >= limit) {
        return current;
      }

      nextPages.push(sectionName);
      const nextSections = {
        ...(current.sections || {}),
        [sectionName]: current.sections?.[sectionName] || 'Choose an option below to order, book, buy, request a quote, view a menu, or contact us.'
      };

      if (removedPage) {
        setTimeout(() => setMessage(`${sectionName} was added. ${removedPage} was removed because this plan is already at its section limit. You can reselect it after upgrading or removing another section.`), 0);
      } else {
        setTimeout(() => setMessage(`${sectionName} was added. Now add a Book Now, Order Now, Buy Now, or Request Quote button.`), 0);
      }

      return {
        ...current,
        pages: normalizeSelectedPagesForPlan(nextPages, current.plan, current.extraPages || current.extra_pages),
        sections: nextSections
      };
    });
  }

  function applyActionPreset(label, type, note) {
    setSite(current => {
      const sectionName = 'Order / Book / Buy';
      let pages = normalizeSelectedPagesForPlan(current.pages || ['Home'], current.plan, current.extraPages || current.extra_pages);
      const limit = planSectionLimit(current.plan, current.extraPages || current.extra_pages);
      let nextPages = [...pages];
      let removedPage = '';

      if (!nextPages.includes(sectionName)) {
        if (limit < 99 && nextPages.length >= limit) {
          for (let i = nextPages.length - 1; i >= 0; i -= 1) {
            if (nextPages[i] !== 'Home') {
              removedPage = nextPages[i];
              nextPages.splice(i, 1);
              break;
            }
          }
        }
        if (limit >= 99 || nextPages.length < limit) nextPages.push(sectionName);
      }

      const next = {
        ...current,
        pages: normalizeSelectedPagesForPlan(nextPages, current.plan, current.extraPages || current.extra_pages),
        sections: {
          ...(current.sections || {}),
          [sectionName]: current.sections?.[sectionName] || 'Choose an option below to order, book, buy, request a quote, view a menu, or contact us.'
        },
        customerActions: normalizeCustomerActions([{ label, type, value: '', note }], current.plan)
      };

      setTimeout(() => {
        setMessage(`${label} was added to the ${sectionName} section. Add the customer phone number, email, booking link, checkout link, menu link, payment link, or form link next.${removedPage ? ` ${removedPage} was removed because this plan was at its section limit.` : ''}`);
      }, 0);

      return next;
    });
  }

  function startNewDraft() {
    const ok = window.confirm('Start a fresh website draft? Your current draft is already saved in this browser if autosave ran, but click Cancel if you want to manually Save Draft first.');
    if (!ok) return;
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(GUEST_CLAIM_KEY);
    localStorage.removeItem(LAST_STEP_KEY);
    localStorage.removeItem(CURRENT_DRAFT_SLUG_KEY);
    setSite(createDefaultSite());
    setStep(0);
    setMessage('Started a fresh website draft.');
    setSaveMessage('Fresh draft opened.');
  }

  function ensureMediaSection(section) {
    if (!section || site.pages.includes(section) || !pageOptions.includes(section)) return true;
    if (!planAllowsMedia(site.plan)) {
      setMessage('Image and video/media uploads unlock with Starter Pro, Business, and Premium. Upgrade to add uploaded visuals or media links.');
      return false;
    }
    const limit = planLimit();
    if (site.pages.length >= limit && site.plan !== 'premium') {
      setMessage(`${plans[site.plan]?.label} includes ${limit} selected section(s). The media was saved, but showing ${section} requires the add-on or a higher plan.`);
      return false;
    }
    setSite(current => current.pages.includes(section) ? current : { ...current, pages: normalizeSelectedPagesForPlan([...current.pages, section], current.plan, current.extraPages || current.extra_pages) });
    setSaveMessage(`${section} was added to your selected sections so the media can show in the preview.`);
    return true;
  }

  function persistLocal(note = 'Draft saved in this browser.', silent = false) {
    try {
      const lightDraft = stripHeavyLocalData({ ...site, localDraftVersion: 1, updatedAt: new Date().toISOString() });
      localStorage.setItem(DRAFT_KEY, JSON.stringify(lightDraft));
      localStorage.setItem(LAST_STEP_KEY, String(step));
      localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draftSlugFor(lightDraft));
      saveLocalDraftIndex(lightDraft);
      if (!silent) setSaveMessage(`${note} ${nowStamp()}`);
      return lightDraft;
    } catch (e) {
      if (!silent) setSaveMessage('We could not save this draft in your browser. Create a free account to save your work securely.');
      return null;
    }
  }

  async function syncGuestDraftClaim(draft, quiet = false) {
    if (!draft || hasOwnerSession) return null;
    let existing = null;
    try { existing = safeParse(localStorage.getItem(GUEST_CLAIM_KEY)); } catch {}
    try {
      const response = await fetch('/api/site/guest-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: draft,
          claimId: existing?.claimId || '',
          claimToken: existing?.claimToken || ''
        })
      });
      if (response.status === 410 && existing) {
        localStorage.removeItem(GUEST_CLAIM_KEY);
        return syncGuestDraftClaim(draft, quiet);
      }
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Temporary account transfer could not be prepared.');
      localStorage.setItem(GUEST_CLAIM_KEY, JSON.stringify({ claimId: result.claimId, claimToken: result.claimToken, expiresAt: result.expiresAt }));
      if (!quiet) setSaveMessage('Saved on this device. Create a free account to save permanently and open this website on other devices.');
      return result;
    } catch (error) {
      if (!quiet) setSaveMessage(`${error.message} Your browser draft remains available.`);
      return null;
    }
  }

  async function saveDraftOnline(draft, quiet = false) {
    if (!hasOwnerSession) {
      throw new Error('Sign in from the account window before saving online.');
    }
    const res = await fetch('/api/site/draft', {
      method: 'POST',
      headers: ownerAuthHeaders(),
      body: JSON.stringify({ site: draft })
    });
    const data = await res.json();
    if (!data.ok) {
      const error = new Error(data.error || 'Online draft save failed.');
      error.status = res.status;
      throw error;
    }
    if (!quiet) setSaveMessage(`Draft saved online. Find it later from My Website using your email or this name: ${data.slug}. ${nowStamp()}`);
    return data;
  }

  async function saveDraft() {
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan, site.extraPages || site.extra_pages), slug: draftSlugFor(site), draftName: site.draftName || site.businessName, status: 'draft' };
    setIsSaving(true);
    setSaveMessage('Saving draft...');
    try {
      const lightDraft = stripHeavyLocalData(draft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(lightDraft));
      localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draft.slug);
      saveLocalDraftIndex(lightDraft);
      if (!hasOwnerSession) {
        await syncGuestDraftClaim(lightDraft);
      } else {
        await saveDraftOnline(draft);
      }
    } catch (e) {
      setSaveMessage(`Draft saved lightly in this browser. Online draft could not save: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function missingActionLinks(currentSite = site) {
    const selected = normalizeSelectedPagesForPlan(currentSite.pages, currentSite.plan, currentSite.extraPages || currentSite.extra_pages);
    const usesActionSection = selected.includes('Order / Book / Buy') || selected.includes('Customer Action');
    if (!usesActionSection) return [];
    return normalizeCustomerActions(currentSite.customerActions, currentSite.plan)
      .filter(action => !String(action.value || '').trim());
  }

  async function goVideo() {
    if (!planAllowsAiVideo(site.plan)) {
      persistLocal('Draft saved before viewing AI Video upgrade options.');
      setMessage('AI Video Studio is available on Business and Premium. Upgrade to unlock real AI video creation.');
      setTimeout(() => { window.location.href = '/checkout/ai-video'; }, 650);
      return;
    }
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan, site.extraPages || site.extra_pages), slug: draftSlugFor(site), draftName: site.draftName || site.businessName, status: 'draft' };
    persistLocal('Draft saved before opening AI Video Studio.');
    saveLocalDraftIndex(draft);
    setSaveMessage('Saving your draft before opening AI Video Studio...');
    try { await saveDraftOnline(draft, true); } catch {}
    window.location.href = `/video-studio?return=builder&draft=${encodeURIComponent(draft.slug)}`;
  }

  async function publishFree() {
    if (!hasOwnerSession) {
      persistLocal('Draft saved before secure email verification.');
      setMessage('Sign in or create an account before publishing. Your browser draft is safe.');
      openAccountModal({ mode: 'create', destination: '/builder' });
      return;
    }
    const businessSlug = slugify(site.businessName || '');
    if (!businessSlug || ['my-business-name', 'my-website', 'published-website'].includes(businessSlug)) {
      setStep(1);
      setMessage('Add your real business or website name in Website Info before publishing. This name creates your unique website address.');
      return;
    }
    const incompleteActions = missingActionLinks(site);
    if (incompleteActions.length) {
      setStep(3);
      setMessage(`Add the email, phone number, booking link, order link, menu link, or checkout link for ${incompleteActions.map(action => action.label).join(', ')} before publishing. Buttons without a destination cannot be clicked.`);
      return;
    }
    const published = { ...site, slug: draftSlugFor(site), draftName: site.draftName || site.businessName, pages: normalizeSelectedPagesForPlan(site.pages, 'free'), plan: 'free', status: 'published' };
    try { const lightPublished = stripHeavyLocalData(published); localStorage.setItem(DRAFT_KEY, JSON.stringify(lightPublished)); localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, published.slug); saveLocalDraftIndex(lightPublished); } catch {}
    setMessage('Publishing free launch page...');
    try {
      const res = await fetch('/api/site/publish', {
        method: 'POST',
        headers: ownerAuthHeaders(),
        body: JSON.stringify({ site: published })
      });
      const data = await res.json();
      if (data.ok) window.location.href = '/checkout/success?paid=free';
      else setMessage(data.error || 'Publish failed.');
    } catch (e) {
      setMessage(`Publish failed: ${e.message}`);
    }
  }

  async function ensureCheckoutIntent(plan, draftSlug, existingIntentId = '') {
    const intentId = existingIntentId || pendingCheckoutIntent || '';
    const response = await fetch('/api/checkout/intent/start', {
      method: 'POST',
      headers: ownerAuthHeaders(),
      body: JSON.stringify({ plan, draftSlug, intentId })
    });
    const data = await response.json();
    if (!data.ok || !data.intentId) throw new Error(data.error || 'Secure checkout could not start.');
    setPendingCheckoutIntent(data.intentId);
    if (data.replaced) {
      const nextParams = new URLSearchParams({ checkoutIntent: data.intentId, draft: draftSlug, resumeCheckout: '1' });
      window.history.replaceState({}, document.title, `/builder?${nextParams.toString()}`);
    }
    return data.intentId;
  }

  async function continueServerCheckout(intentId, draftSlug) {
    const response = await fetch('/api/checkout/intent/continue', {
      method: 'POST',
      headers: ownerAuthHeaders(),
      body: JSON.stringify({ intentId, draftSlug })
    });
    const data = await response.json();
    if (!data.ok || !data.checkoutPath) {
      const error = new Error(data.error || 'Secure checkout could not continue.');
      error.status = response.status;
      throw error;
    }
    return data.checkoutPath;
  }

  async function checkoutExtraPage(existingIntentId = '') {
    const draftSlug = draftSlugFor(site);
    if (!['starter', 'business'].includes(site.plan)) {
      setMessage(site.plan === 'free'
        ? 'The Extra Page Add-On requires an active Starter Pro or Business website. Choose a paid website plan first.'
        : 'Premium already includes all built-in sections; no Extra Page Add-On is needed.');
      return;
    }
    let intentId = '';
    try {
      intentId = await ensureCheckoutIntent('extra', draftSlug, existingIntentId);
      const checkoutIntent = createPendingCheckoutIntent('extra', draftSlug);
      if (checkoutIntent) localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify({ ...checkoutIntent, intentId }));
    } catch (error) {
      setMessage(error.message || 'Secure checkout could not start. Your draft is still safe.');
      return;
    }
    if (!hasOwnerSession) {
      persistLocal('Draft saved before secure email verification.');
      setMessage('Verify your email before the add-on checkout so it is attached to the correct website.');
      openAccountModal({ mode: 'signin', destination: `/checkout/continue?intent=${encodeURIComponent(intentId)}&draft=${encodeURIComponent(draftSlug)}` });
      return;
    }
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan, site.extraPages || site.extra_pages), slug: draftSlug, draftName: site.draftName || site.businessName, status: 'draft' };
    try {
      await saveDraftOnline(draft, true);
    } catch (error) {
      if (error.status === 401) {
        try { localStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
        setMessage('Your secure session expired. Re-verify your email to continue this add-on checkout.');
        setTimeout(() => { window.location.href = `/checkout/continue?intent=${encodeURIComponent(intentId)}&draft=${encodeURIComponent(draft.slug)}`; }, 700);
        return;
      }
      setMessage(error.message || 'Secure online draft save failed. Add-on checkout was not opened.');
      return;
    }
    try {
      const checkoutPath = await continueServerCheckout(intentId, draft.slug);
      localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
      window.location.href = checkoutPath;
    } catch (error) {
      setMessage(error.message || 'Secure add-on checkout could not continue. Your draft is still safe.');
    }
  }

  async function checkoutPlan(existingIntentId = '') {
    if (checkoutBusyRef.current) return;
    checkoutBusyRef.current = true;
    const selectedPlan = site.plan;
    setCheckoutBusyPlan(selectedPlan);
    setCheckoutRetryPlan('');
    setMessage(`Opening your secure ${plans[selectedPlan]?.label || 'paid-plan'} checkout…`);
    const draftSlug = draftSlugFor(site);
    let intentId = '';
    try {
      intentId = await ensureCheckoutIntent(selectedPlan, draftSlug, existingIntentId);
      const checkoutIntent = createPendingCheckoutIntent(selectedPlan, draftSlug);
      if (checkoutIntent) localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify({ ...checkoutIntent, intentId }));
    } catch (error) {
      setMessage(error.message || 'Secure checkout could not start. Your draft is still safe.');
      setCheckoutRetryPlan(selectedPlan);
      setCheckoutBusyPlan('');
      checkoutBusyRef.current = false;
      return;
    }
    if (!hasOwnerSession) {
      persistLocal('Draft saved before secure email verification.');
      setMessage('Verify your email before checkout so the paid website belongs securely to you.');
      openAccountModal({ mode: 'signin', destination: `/checkout/continue?intent=${encodeURIComponent(intentId)}&draft=${encodeURIComponent(draftSlug)}` });
      return;
    }
    const incompleteActions = missingActionLinks(site);
    if (incompleteActions.length) {
      setStep(3);
      setMessage(`Add the destination for ${incompleteActions.map(action => action.label).join(', ')} before checkout. Use an email, phone number, booking form, menu, product, payment, or order link.`);
      setCheckoutRetryPlan(selectedPlan);
      setCheckoutBusyPlan('');
      checkoutBusyRef.current = false;
      return;
    }
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan, site.extraPages || site.extra_pages), slug: draftSlugFor(site), draftName: site.draftName || site.businessName, status: 'draft' };
    try { const lightDraft = stripHeavyLocalData(draft); localStorage.setItem(DRAFT_KEY, JSON.stringify(lightDraft)); localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draft.slug); saveLocalDraftIndex(lightDraft); } catch {}
    setMessage('Saving your draft before checkout. If checkout opens, your draft was saved.');
    try {
      await saveDraftOnline(draft, true);
    } catch (error) {
      if (error.status === 401) {
        try { localStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
        setMessage('Your secure session expired. Re-verify your email to continue this checkout.');
        setTimeout(() => { window.location.href = `/checkout/continue?intent=${encodeURIComponent(intentId)}&draft=${encodeURIComponent(draft.slug)}`; }, 700);
        return;
      }
      setMessage(error.message || 'Secure online draft save failed. Checkout was not opened.');
      setCheckoutRetryPlan(selectedPlan);
      setCheckoutBusyPlan('');
      checkoutBusyRef.current = false;
      return;
    }
    try {
      const checkoutPath = await continueServerCheckout(intentId, draft.slug);
      localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
      window.location.href = checkoutPath;
    } catch (error) {
      if (error.status === 401) {
        try { localStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
        setMessage('Your secure session expired. Re-verify your email to continue this checkout.');
        setTimeout(() => { window.location.href = `/checkout/continue?intent=${encodeURIComponent(intentId)}&draft=${encodeURIComponent(draft.slug)}`; }, 700);
        return;
      }
      setMessage(error.message || 'Secure checkout could not continue. Your draft is still safe.');
      setCheckoutRetryPlan(selectedPlan);
      setCheckoutBusyPlan('');
      checkoutBusyRef.current = false;
    }
  }

  async function uploadHero(file) {
    setSaveMessage('Preparing hero image...');
    try {
      const image = await compressImage(file, 760, 0.64);
      update({ heroImage: image });
      setSaveMessage('Hero image added. Click Save Draft to keep it online.');
    } catch (e) {
      setSaveMessage(e.message || 'Image upload failed.');
    }
  }

  function next() { persistLocal('Draft saved.'); setStep(s => Math.min(4, s + 1)); }
  function back() { persistLocal('Draft saved.'); setStep(s => Math.max(0, s - 1)); }

  const selectedSections = normalizeSelectedPagesForPlan(site.pages, site.plan, site.extraPages || site.extra_pages);
  const selectedCount = selectedSections.length;
  const limitText = plans[site.plan]?.maxPages >= 99 ? 'all built-in sections' : `${planLimit()} selected section(s)`;
  const canUseMedia = planAllowsMedia(site.plan);
  const canUseAiVideo = planAllowsAiVideo(site.plan);
  // Keep the preview tied directly to the current form state so wording and
  // customer-action links update immediately while the customer types.
  const previewSite = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan, site.extraPages || site.extra_pages) };

  const mediaPreviewKey = (site.media || []).map(item => `${item.section || ''}:${item.kind || ''}:${String(item.url || '').slice(-24)}:${item.title || ''}`).join('|');
  const previewKey = `${site.typeKey}-${site.styleKey}-${site.primaryColor}-${site.accentColor}-${site.fontStyle}-${site.layoutStyle}-${site.backgroundStyle}-${site.sectionShape}-${site.templateAppliedAt || ''}-${site.designUpdatedAt || ''}-${site.heroImage ? site.heroImage.slice(-32) : 'template-hero'}-${JSON.stringify(site.pages || [])}-${mediaPreviewKey}-${JSON.stringify(site.customerActions || [])}`;

  return (
    <main className="builderShell">
      <aside className="builderSide">
        <a className="builderHomeLogo" href="https://www.cookiesdigitalcreations.com/" aria-label="Return to homepage">
          <img src="/cookie-mini-website-builder-logo.png" alt="Cookie Mini Website Builder Pro" />
          <span>Cookie Mini Website Builder Pro</span>
        </a>
        {['Choose Type & Look','Website Info','Design','Sections & Wording','Preview & Publish'].map((label, index) => (
          <button className={`stepBtn ${step === index ? 'active' : ''}`} onClick={() => { persistLocal('Draft saved.'); setStep(index); }} key={label}>{index + 1}. {label}</button>
        ))}
        <button className="btn light" onClick={saveDraft} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Draft'}</button>
        {isSmallBuilderScreen && <button className="btn" onClick={() => setIsMobilePreviewOpen(true)}>Open Live Preview</button>}
        {planAllowsAiVideo(site.plan) ? <button className="btn light aiStudioBuilderBtn" onClick={goVideo}>AI Video Studio</button> : <button className="btn light lockedBtn aiStudioBuilderBtn" onClick={goVideo}>AI Video Upgrade</button>}
        <button className="btn light" type="button" onClick={() => hasOwnerSession ? window.location.assign('/customer') : openAccountModal({ mode: 'signin', destination: '/customer' })}>My Websites</button>
        <button className="btn light" onClick={startNewDraft}>Start Fresh Draft</button>
        {showCurrentDraft && (
          <div className="notice smallNotice currentDraftNotice" role="status">
            <span><strong>Current draft:</strong> {draftSlugFor(site)}.cookiesdigitalcreations.com</span>
            <button type="button" className="saveStatusDismiss" onClick={() => setShowCurrentDraft(false)} aria-label="Dismiss current draft message">×</button>
          </div>
        )}
        {saveMessage && (
          <div className={`notice smallNotice saveStatusNotice ${/could not|failed|error|trouble/i.test(saveMessage) ? 'error' : ''}`} role="status" aria-live="polite">
            <span>{saveMessage}</span>
            <button type="button" className="saveStatusDismiss" onClick={() => setSaveMessage('')} aria-label="Dismiss draft message">×</button>
          </div>
        )}
      </aside>

      <section className="builderMain">
        <div className="row builderTwoCol">
          <div className="dashboard builderPanel">
            {!hasOwnerSession && (
              <div className="notice guestDraftNotice" role="status">
                <strong>Saved on this device</strong><br />
                Saved on this device. Sign in or create an account when you want to save permanently, purchase, or publish.
              </div>
            )}
            {isSmallBuilderScreen && <div className="notice mobilePreviewNotice"><strong>Mobile tip:</strong> Tap the button below to preview your site in a separate screen, then close it to keep editing.<br /><button type="button" className="btn mobilePreviewInlineBtn" onClick={() => setIsMobilePreviewOpen(true)}>Open Live Preview</button></div>}
            {step === 0 && (
              <>
                <h2>Choose website type and design look</h2>
                <p className="mutedText">Pick what the site is for first. Then pick the visual look. This changes the starter wording, pages, artwork, and design feel.</p>
                <div className="templateList bigTemplateList">
                  {templateLibrary.map(t => (
                    <button className={`pick ${site.typeKey === t.key ? 'active' : ''}`} onClick={() => chooseType(t.key)} key={t.key}>
                      <strong>{t.type}</strong><br />
                      <small>{t.pages.join(' • ')}</small>
                    </button>
                  ))}
                </div>
                <h3>Choose visual style</h3>
                <StylePicker typeKey={site.typeKey} styleKey={site.styleKey} selectStyle={selectStyle} />
                <NavRow back={back} next={next} />
              </>
            )}

            {step === 1 && (
              <>
                <h2>Website Info</h2>
                <p className="mutedText">Enter the words that build the website. The preview updates on the right.</p>
                <Field label="Business / website name"><input value={site.businessName || ''} onChange={e => update({ businessName: e.target.value })} /></Field>
                <Field label="Draft name / website address"><input placeholder="Example: cookie-kitchen-menu" value={site.draftName || ''} onChange={e => update({ draftName: e.target.value })} /></Field>
                <Field label="Customer email for Contact button and dashboard"><input type="email" value={site.customerEmail || ''} onChange={e => update({ customerEmail: e.target.value })} /></Field>
                <Field label="Phone (optional; not shown in top header)"><input value={site.phone || ''} onChange={e => update({ phone: e.target.value })} /></Field>
                <Field label="Homepage headline"><input value={site.headline || ''} onChange={e => update({ headline: e.target.value })} /></Field>
                <Field label="Homepage description"><textarea value={site.description || ''} onChange={e => update({ description: e.target.value })} /></Field>
                <Field label="Home extra wording / short intro"><textarea value={site.sections?.Home || ''} onChange={e => updateSection('Home', e.target.value)} /></Field>
                <Field label="Offer section title"><input value={site.offerTitle || ''} onChange={e => update({ offerTitle: e.target.value })} /></Field>
                {site.offers.map((offer, index) => (
                  <div className="card miniCard" key={index}>
                    <h3>Offer Box {index + 1}</h3>
                    <label>Box title</label>
                    <input value={offer.title || ''} onChange={e => {
                      const offers = [...site.offers];
                      offers[index] = { ...offers[index], title: e.target.value };
                      update({ offers });
                    }} />
                    <label>Box wording</label>
                    <textarea value={offer.text || ''} onChange={e => {
                      const offers = [...site.offers];
                      offers[index] = { ...offers[index], text: e.target.value };
                      update({ offers });
                    }} />
                  </div>
                ))}
                <NavRow back={back} next={next} />
              </>
            )}

            {step === 2 && (
              <>
                <h2>Design</h2>
                {site.typeKey === 'food' && <div className="notice"><strong>Food template image controls:</strong> The restaurant hero, menu promotion, and event promotion include original starter artwork. Starter Pro and higher customers can replace the hero here, then replace the Menu or Gallery promotion by uploading their own image to that section in Sections &amp; Wording.</div>}
                {site.typeKey === 'beauty' && <div className="notice"><strong>Beauty template image controls:</strong> The salon hero, services promotion, and gallery promotion include original starter artwork. Starter Pro and higher customers can replace the hero here, then replace the Services or Gallery promotion by uploading their own image to that section in Sections &amp; Wording.</div>}
                <p className="mutedText">Change the website type, template look, colors, layout, hero image, and media. Template changes apply immediately to the preview.</p>
                <Field label="Plan"><select value={site.plan} onChange={e => {
                  const nextPlan = e.target.value;
                  if (nextPlan !== site.plan) {
                    setPendingCheckout('');
                    setPendingCheckoutIntent('');
                    setResumeCheckoutRequested(false);
                    setCheckoutBusyPlan('');
                    setCheckoutRetryPlan('');
                    checkoutBusyRef.current = false;
                  }
                  update({ plan: nextPlan, pages: normalizeSelectedPagesForPlan(site.pages || ['Home'], nextPlan, site.extraPages || site.extra_pages), customerActions: normalizeCustomerActions(site.customerActions, nextPlan) });
                  setMessage(`Plan changed to ${plans[nextPlan]?.label}. Pick your own sections below instead of letting a template choose for you.`);
                }}>{Object.entries(plans).map(([k, v]) => <option value={k} key={k}>{v.label} - {v.price}</option>)}</select></Field>
                <Field label="Website type"><select value={site.typeKey} onChange={e => chooseType(e.target.value)}>{templateLibrary.map(t => <option value={t.key} key={t.key}>{t.type}</option>)}</select></Field>
                <h3>Template look</h3>
                <StylePicker typeKey={site.typeKey} styleKey={site.styleKey} selectStyle={selectStyle} />
                <h3>More design options</h3>
                <div className="row">
                  <Field label="Main color"><input type="color" value={site.primaryColor || '#20172f'} onChange={e => updateDesign({ primaryColor: e.target.value })} /></Field>
                  <Field label="Accent color"><input type="color" value={site.accentColor || '#c46a2d'} onChange={e => updateDesign({ accentColor: e.target.value })} /></Field>
                </div>
                <div className="row">
                  <Field label="Page layout"><select value={site.layoutStyle || 'split'} onChange={e => updateDesign({ layoutStyle: e.target.value })}><option value="split">Split hero</option><option value="centered">Centered hero</option><option value="visual-first">Visual first</option></select></Field>
                  <Field label="Font feel"><select value={site.fontStyle || 'bold'} onChange={e => updateDesign({ fontStyle: e.target.value })}><option value="bold">Bold business</option><option value="elegant">Elegant</option><option value="playful">Playful</option><option value="clean">Clean modern</option></select></Field>
                </div>
                <div className="row">
                  <Field label="Background feel" help="Each option now changes the preview with a different mood. Pattern / art adds decorative artwork based on the website type."><select value={site.backgroundStyle || 'gradient'} onChange={e => updateDesign({ backgroundStyle: e.target.value })}><option value="gradient">Gradient glow</option><option value="dark">Dark luxury</option><option value="soft">Soft light</option><option value="pattern">Pattern / art</option></select></Field>
                  <Field label="Section style"><select value={site.sectionShape || 'cards'} onChange={e => updateDesign({ sectionShape: e.target.value })}><option value="cards">Clean cards</option><option value="floating">Floating 3D cards</option><option value="boxed">Boxed sections</option></select></Field>
                </div>
                {planAllowsMedia(site.plan) ? <>
                  <Field label="Upload hero image / website visual"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && uploadHero(e.target.files[0])} /><small>JPEG, PNG, or WebP; up to 8 MB and 6000 pixels per side.</small>{site.heroImage && <button className="btn dark" onClick={() => update({ heroImage: '' })}>Remove Uploaded Image</button>}</Field>
                  <Field label="Video or media link for this website"><input placeholder="https://youtube.com/... or TikTok/Instagram/Vimeo link" value={site.heroMediaLink || ''} onChange={e => update({ heroMediaLink: e.target.value })} /></Field>
                </> : <div className="notice"><strong>Image/video uploads are not included on the Free Launch Page.</strong><br />Starter Pro, Business, and Premium unlock image uploads and video/media links.</div>}
                <NavRow back={back} next={next} />
              </>
            )}

            {step === 3 && (
              <>
                <h2>Sections & Wording</h2>
                <p className="mutedText">Choose only the sections this customer will complete. Only selected sections appear below and in the live preview, which keeps the builder shorter and less confusing.</p>
                <div className="notice"><strong>{plans[site.plan]?.label}</strong> includes {limitText}. Selected now: {selectedCount}{plans[site.plan]?.maxPages >= 99 ? '' : ` / ${planLimit()}`}.</div>
                <div className="planRulesBox">
                  <strong>Current plan rules:</strong>
                  <ul>
                    <li>Free Launch Page: 3 selected sections.</li>
                    <li>Starter Pro: 4 selected sections plus image/video upload options.</li>
                    <li>Business: 6 selected sections plus image/video upload options and AI Video Studio.</li>
                    <li>Premium: all built-in sections plus image/video upload options and AI Video Studio.</li>
                    <li>Order / Book / Buy buttons: Free 1, Starter 2, Business 4, Premium 8.</li>
                  </ul>
                </div>
                <div className="builderActionGuide actionSelectorPanel">
                  <strong>Build the customer path:</strong>
                  <span>1. Pick your own sections.</span>
                  <span>2. Select <b>Order / Book / Buy</b>.</span>
                  <span>3. Add buttons like <b>Book Now</b>, <b>Order Now</b>, <b>Buy Now</b>, or <b>Request Quote</b>.</span>
                  <div className="actionSelectorButtons">
                    <button type="button" className="btn" onClick={addOrderBookBuySection}>Select Order / Book / Buy</button>
                    <button type="button" className="btn light" onClick={() => applyActionPreset('Book Now', 'book', 'Add your booking calendar or appointment link.')}>Add Book Now</button>
                    <button type="button" className="btn light" onClick={() => applyActionPreset('Order Now', 'order', 'Add your order form, menu, or checkout link.')}>Add Order Now</button>
                    <button type="button" className="btn light" onClick={() => applyActionPreset('Buy Now', 'buy', 'Add your product checkout or Gumroad link.')}>Add Buy Now</button>
                    <button type="button" className="btn light" onClick={() => applyActionPreset('Request Quote', 'quote', 'Add your quote form or contact link.')}>Add Request Quote</button>
                  </div>
                </div>
                <div className="templateList pagePickList sectionPickList">
                  {pageOptions.map(page => {
                    const isSelected = selectedSections.includes(page);
                    const isHome = page === 'Home';
                    const isAtLimit = !isSelected && plans[site.plan]?.maxPages < 99 && selectedCount >= planLimit();
                    const isActionPage = page === 'Order / Book / Buy';
                    return (
                      <button
                        className={`pick ${isSelected ? 'active' : ''} ${isAtLimit && !isActionPage ? 'lockedPick' : ''} ${isActionPage ? 'orderBookBuyPick' : ''}`}
                        key={page}
                        disabled={(isAtLimit && !isActionPage) || (isHome && isSelected)}
                        onClick={() => isSelected ? removePage(page) : (isActionPage ? addOrderBookBuySection() : addPage(page))}
                        title={isAtLimit && !isActionPage ? 'Upgrade or remove another section first.' : (isActionPage && isAtLimit ? 'This will swap out your last selected section so Order / Book / Buy can be added.' : '')}
                      >
                        {isSelected ? '✓ ' : ''}{page}{isHome ? ' (required)' : ''}<br />
                        <small>{isActionPage && isAtLimit && !isSelected ? 'Click to add this action section. It will swap out the last selected section because this plan is full.' : (isAtLimit ? 'Plan limit reached. Upgrade or remove another selected section.' : sectionPrompts[page])}</small>
                      </button>
                    );
                  })}
                </div>
                <h3>Write wording for selected sections only</h3>
                <p className="mutedText">These are the only sections that will appear in the live preview and on the published website for this plan.</p>
                {selectedSections.map(page => (
                  page === 'Order / Book / Buy' || page === 'Customer Action' ? (
                    <CustomerActionEditor
                      key={page}
                      site={site}
                      updateSection={updateSection}
                      updateCustomerActions={updateCustomerActions}
                    />
                  ) : (
                    <Field label={`${page} wording`} help={sectionPrompts[page]} key={page}>
                      <textarea value={site.sections?.[page] || ''} onChange={e => updateSection(page, e.target.value)} />
                    </Field>
                  )
                ))}
                <h3>Gallery / media items</h3>
                {site.typeKey === 'food' && <div className="notice"><strong>Replace a Food template image:</strong> Upload an image to <b>Menu</b> to replace the starter menu-promotion artwork, or upload one to <b>Gallery</b> to replace the starter event artwork. Titles and wording remain editable above.</div>}
                {site.typeKey === 'beauty' && <div className="notice"><strong>Replace a Beauty template image:</strong> Upload an image to <b>Services</b> to replace the starter services artwork, or upload one to <b>Gallery</b> to replace the starter hairstyle-gallery artwork. Titles and wording remain editable above.</div>}
                {canUseMedia ? <>
                  <p className="mutedText">Starter Pro, Business, and Premium can add uploaded images and video/media links to selected visual sections.</p>
                  <MediaEditor site={{ ...site, pages: selectedSections }} update={update} setSaveMessage={setSaveMessage} ensureMediaSection={ensureMediaSection} />
                </> : <div className="notice"><strong>Media uploads unlock with Starter Pro and higher.</strong><br />Free Launch Page customers can choose 3 sections and publish text-based launch information. Upgrade to add images or video/media links.</div>}
                {!canUseAiVideo && <div className="notice"><strong>AI Video Studio upgrade:</strong> Real AI Video Studio opens on Business and Premium. Lower plans can see the upgrade offer, but they cannot open the studio from the builder.</div>}
                <NavRow back={back} next={next} />
              </>
            )}

            {step === 4 && (
              <>
                <h2>Preview & Publish</h2>
                {message && <div className="notice error">{message}</div>}
                <p>Your website name will be:</p>
                <div className="notice"><strong>{plans[site.plan]?.label}</strong> will publish {limitText}. Selected sections: {selectedSections.join(', ')}.</div>
                <div className="notice"><strong>{draftSlugFor(site)}.cookiesdigitalcreations.com</strong></div>
                <button className="btn dark" onClick={saveDraft}>Save Draft / Continue Later</button>{' '}
                {site.plan === 'free' ? <button className="btn" onClick={publishFree}>Publish Free Page</button> : (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => checkoutPlan()}
                    disabled={Boolean(checkoutBusyPlan)}
                    aria-busy={checkoutBusyPlan === site.plan}
                  >
                    {checkoutBusyPlan === site.plan
                      ? `Opening Secure ${plans[site.plan]?.price} Checkout…`
                      : checkoutRetryPlan === site.plan
                        ? `Retry Secure ${plans[site.plan]?.price} Checkout`
                        : `Go to Secure ${plans[site.plan]?.price} Checkout`}
                  </button>
                )}
                <div className="navRow"><button className="btn dark" onClick={back}>Back</button></div>
              </>
            )}
          </div>

          {!isSmallBuilderScreen && <div className="previewSticky">
            <div className="previewTitle"><strong>Live Draft Preview</strong><span>Updates as you build</span></div>
            <SitePreview key={previewKey} site={previewSite} draftMode />
          </div>}
        </div>
      </section>
      {isSmallBuilderScreen && isMobilePreviewOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(18,7,29,.72)', display: 'grid', placeItems: 'stretch', padding: 10 }}>
        <div style={{ background: '#fff8f1', borderRadius: 24, overflow: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,.35)' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, background: '#20172f', color: 'white' }}>
            <strong>Live Draft Preview</strong>
            <button type="button" onClick={() => setIsMobilePreviewOpen(false)} style={{ border: 0, borderRadius: 999, padding: '10px 14px', fontWeight: 900, background: '#ff9e26', color: '#20172f' }}>Close Preview</button>
          </div>
          <div style={{ padding: 12 }}>
            <SitePreview key={`${previewKey}-mobile`} site={previewSite} draftMode />
          </div>
        </div>
      </div>}
    </main>
  );
}

function Field({ label, help, children }) {
  const fieldId = useId();
  let connected = false;
  const labelledChildren = Children.map(children, child => {
    if (!connected && isValidElement(child) && ['input', 'select', 'textarea'].includes(child.type)) {
      connected = true;
      return cloneElement(child, { id: child.props.id || fieldId });
    }
    return child;
  });
  return <div className="field"><label htmlFor={fieldId}>{label}</label>{help && <small>{help}</small>}{labelledChildren}</div>;
}

function NavRow({ back, next }) {
  return <div className="navRow"><button className="btn dark" onClick={back}>Back</button><button className="btn" onClick={next}>Save & Continue</button></div>;
}

function StylePicker({ typeKey, styleKey, selectStyle }) {
  const type = templateLibrary.find(t => t.key === typeKey) || templateLibrary[0];
  return <div className="templateList stylePickList enhancedStylePicker">{type.styles.map(style => (
    <button className={`pick styleCard enhancedStyleCard ${styleKey === style.key ? 'active' : ''}`} onClick={() => selectStyle(style.key)} key={style.key}>
      <span className="stylePalette" style={{ background: `linear-gradient(135deg, ${style.palette?.primary || '#20172f'}, ${style.palette?.accent || '#c46a2d'})` }} />
      <span className={`styleThumb styleThumb-${type.key} styleThumb-${style.key}`}>
        <b>{style.art}</b><i></i><i></i><i></i>
      </span>
      <strong>{style.name}</strong>
      <small>{style.visual || style.mood}</small>
      <em>{styleKey === style.key ? 'Selected look' : 'Apply this look'}</em>
    </button>
  ))}</div>;
}


function CustomerActionEditor({ site, updateSection, updateCustomerActions }) {
  const actions = normalizeCustomerActions(site.customerActions, site.plan);
  const limit = customerActionLimit(site.plan);
  const canAddMore = actions.length < limit;
  const sectionName = 'Order / Book / Buy';

  function updateAction(index, patch) {
    const next = [...actions];
    next[index] = { ...next[index], ...patch };
    updateCustomerActions(next);
  }

  function addAction() {
    if (!canAddMore) return;
    updateCustomerActions([...actions, { label: 'Book Now', type: 'book', value: '', note: '' }]);
  }

  function removeAction(index) {
    updateCustomerActions(actions.filter((_, i) => i !== index));
  }

  return (
    <div className="customerActionEditor">
      <h3>Order / Book / Buy section</h3>
      <p className="mutedText">
        Add the buttons visitors need to contact, order, book, buy, request a quote, view a menu, or make a payment.
        Use outside links like Gumroad, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, phone, text, email, or any custom checkout link.
      </p>

      <Field label="Section wording" help={sectionPrompts[sectionName]}>
        <textarea
          value={site.sections?.[sectionName] || ''}
          onChange={e => updateSection(sectionName, e.target.value)}
          placeholder="Ready to order, book, buy, or request a quote? Choose an option below."
        />
      </Field>

      <div className="notice">
        <strong>{plans[site.plan]?.label}</strong> includes up to {limit} customer action button{limit === 1 ? '' : 's'}.
      </div>

      <div className="quickActionPresetGrid">
        <button type="button" className="btn light" onClick={() => updateCustomerActions([{ label: 'Book Now', type: 'book', value: '', note: 'Add your booking link.' }])}>Use Book Now</button>
        <button type="button" className="btn light" onClick={() => updateCustomerActions([{ label: 'Order Now', type: 'order', value: '', note: 'Add your order form or menu link.' }])}>Use Order Now</button>
        <button type="button" className="btn light" onClick={() => updateCustomerActions([{ label: 'Buy Now', type: 'buy', value: '', note: 'Add your checkout or product link.' }])}>Use Buy Now</button>
        <button type="button" className="btn light" onClick={() => updateCustomerActions([{ label: 'Request Quote', type: 'quote', value: '', note: 'Add your quote form or contact link.' }])}>Use Request Quote</button>
      </div>

      <div className="customerActionList">
        {actions.map((action, index) => {
          const actionMeta = customerActionTypes.find(item => item.key === action.type) || customerActionTypes[customerActionTypes.length - 1];
          return (
            <div className="customerActionCard" key={index}>
              <div className="customerActionCardHeader">
                <strong>Action button {index + 1}</strong>
                {actions.length > 1 && <button className="btn light" type="button" onClick={() => removeAction(index)}>Remove</button>}
              </div>

              <div className="grid2">
                <Field label="Button text">
                  <input
                    value={action.label || ''}
                    onChange={e => updateAction(index, { label: e.target.value })}
                    placeholder={actionMeta.label}
                  />
                </Field>
                <Field label="Action type">
                  <select value={action.type || 'custom'} onChange={e => updateAction(index, { type: e.target.value })}>
                    {customerActionTypes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Phone, email, checkout, booking, menu, payment, or custom link">
                <input
                  value={action.value || ''}
                  onChange={e => updateAction(index, { value: e.target.value })}
                  placeholder={actionMeta.placeholder}
                />
              </Field>

              <Field label="Optional note under button">
                <input
                  value={action.note || ''}
                  onChange={e => updateAction(index, { note: e.target.value })}
                  placeholder="Example: Orders accepted Monday through Saturday."
                />
              </Field>
            </div>
          );
        })}
      </div>

      {canAddMore ? (
        <button className="btn" type="button" onClick={addAction}>Add another action button</button>
      ) : (
        <div className="notice">You reached the action button limit for this plan. Upgrade to add more action buttons.</div>
      )}
    </div>
  );
}


function MediaEditor({ site, update, setSaveMessage, ensureMediaSection }) {
  const media = site.media || [];
  const sections = ['Gallery','Portfolio','Projects','Before & After','Products','Menu','Services'];
  const firstSelectedMediaSection = sections.find(section => site.pages?.includes(section)) || 'Gallery';
  const [quick, setQuick] = useState({ title: '', section: firstSelectedMediaSection, url: '' });

  useEffect(() => {
    const selected = sections.find(section => site.pages?.includes(section));
    if (selected && !site.pages?.includes(quick.section)) setQuick(current => ({ ...current, section: selected }));
  }, [site.pages, quick.section]);

  function setMedia(next) { update({ media: next }); }
  function hasRoom() { if (media.length >= 20) { setSaveMessage('A website can include up to 20 media items. Remove one before adding another.'); return false; } return true; }
  function uploadedImageCount() { return media.filter(item => item?.kind === 'image' && String(item.url || '').startsWith('data:image/')).length + (String(site.heroImage || '').startsWith('data:image/') ? 1 : 0); }
  function addImageSlot(section = firstSelectedMediaSection) { if (!hasRoom() || ensureMediaSection?.(section) === false) return; setMedia([...media, { kind: 'image', url: '', title: '', section }]); }
  function addLinkSlot(section = firstSelectedMediaSection) { if (!hasRoom() || ensureMediaSection?.(section) === false) return; setMedia([...media, { kind: 'link', url: '', title: '', section }]); }
  function addQuickLink() {
    if (!hasRoom()) return;
    if (!quick.url.trim()) { setSaveMessage('Paste a media/video link first.'); return; }
    try { const parsed = new URL(quick.url.trim()); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { setSaveMessage('Enter a complete media link beginning with https:// or http://.'); return; }
    if (ensureMediaSection?.(quick.section) === false) { setSaveMessage(`Select ${quick.section} as a website section before adding media, or remove another section if this plan is at its limit.`); return; }
    setMedia([...media, { kind: 'link', url: quick.url.trim(), title: quick.title || 'Media link', section: quick.section }]);
    setQuick({ ...quick, title: '', url: '' });
    setSaveMessage('Media link added.');
  }
  function updateItem(index, patch) {
    const next = [...media];
    if (patch.section) ensureMediaSection?.(patch.section);
    next[index] = { ...next[index], ...patch };
    setMedia(next);
  }
  function removeItem(index) { setMedia(media.filter((_, i) => i !== index)); }
  async function uploadMedia(index, file) {
    setSaveMessage('Preparing gallery image...');
    try {
      if (uploadedImageCount() >= 12 && !String(media[index]?.url || '').startsWith('data:image/')) throw new Error('A website can include up to 12 uploaded images. Remove one before adding another.');
      const image = await compressImage(file, 560, 0.60);
      updateItem(index, { kind: 'image', url: image, title: media[index]?.title || safeUploadName(file.name) });
      setSaveMessage('Gallery image added. Click Save Draft to keep it online.');
    } catch (e) {
      setSaveMessage(e.message || 'Gallery image upload failed.');
    }
  }
  async function uploadQuick(file) {
    setSaveMessage('Preparing uploaded image...');
    try {
      if (!hasRoom()) return;
      if (uploadedImageCount() >= 12) throw new Error('A website can include up to 12 uploaded images. Remove one before adding another.');
      const image = await compressImage(file, 560, 0.60);
      if (ensureMediaSection?.(quick.section) === false) { setSaveMessage(`The image was not added because ${quick.section} is not selected and this plan is at its section limit.`); return; }
      setMedia([...media, { kind: 'image', url: image, title: quick.title || safeUploadName(file.name), section: quick.section }]);
      setQuick({ ...quick, title: '' });
      setSaveMessage('Image added to media section.');
    } catch (e) {
      setSaveMessage(e.message || 'Image upload failed.');
    }
  }

  const mediaSectionsSelected = sections.filter(sec => site.pages?.includes(sec));

  return <div className="mediaEditor">
    {mediaSectionsSelected.length === 0 && <div className="notice"><strong>Tip:</strong> Select Gallery, Portfolio, Products, Menu, Projects, or Before & After if you want media to show on the live site. Free Launch Page does not include uploads; Starter Pro and higher can add images/media.</div>}
    <div className="quickMediaBox">
      <h4>Quick add media</h4>
      <p className="mutedText">Choose the section first. Starter Pro, Business, and Premium will auto-select that section if your plan has room.</p>
      <div className="row">
        <Field label="Title"><input placeholder="Example: Menu photo, portfolio video, product image" value={quick.title} onChange={e => setQuick({ ...quick, title: e.target.value })} /></Field>
        <Field label="Show in section"><select value={quick.section} onChange={e => setQuick({ ...quick, section: e.target.value })}>{sections.map(p => <option key={p}>{p}</option>)}</select></Field>
      </div>
      <Field label="Upload image to this section"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && uploadQuick(e.target.files[0])} /><small>JPEG, PNG, or WebP; up to 8 MB and 6000 pixels per side.</small></Field>
      <div className="row">
        <Field label="Or paste video/media link"><input placeholder="https://youtube.com/..." value={quick.url} onChange={e => setQuick({ ...quick, url: e.target.value })} /></Field>
        <div className="field mediaButtonField"><label>&nbsp;</label><button className="btn dark" onClick={addQuickLink}>Add Media Link</button></div>
      </div>
    </div>

    <div className="navRow">
      <button className="btn dark" onClick={() => addImageSlot(firstSelectedMediaSection)}>Add Empty Image Slot</button>
      <button className="btn dark" onClick={() => addLinkSlot(firstSelectedMediaSection)}>Add Empty Video Link Slot</button>
    </div>
    {media.length === 0 && <div className="notice">No media added yet. Add an uploaded image or a video/media link.</div>}
    {media.map((item, index) => (
      <div className="card miniCard mediaCard" key={index}>
        <div className="row">
          <Field label="Media title"><input placeholder="Example: Featured product, Before photo, Food plate" value={item.title || ''} onChange={e => updateItem(index, { title: e.target.value })} /></Field>
          <Field label="Show in section"><select value={item.section || 'Gallery'} onChange={e => updateItem(index, { section: e.target.value })}>{sections.map(p => <option key={p}>{p}</option>)}</select></Field>
        </div>
        <Field label="Media type"><select value={item.kind || 'link'} onChange={e => updateItem(index, { kind: e.target.value, url: '' })}><option value="image">Uploaded image</option><option value="link">Video/social/media link</option></select></Field>
        {item.kind === 'image' ? (
          <Field label="Upload image"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files?.[0] && uploadMedia(index, e.target.files[0])} /><small>JPEG, PNG, or WebP; up to 8 MB and 6000 pixels per side.</small>{item.url && <img className="miniMediaPreview" src={item.url} alt={item.title || 'media preview'} />}</Field>
        ) : (
          <Field label="Video/social/media URL"><input placeholder="https://youtube.com/..." value={item.url || ''} onChange={e => updateItem(index, { url: e.target.value })} /></Field>
        )}
        <button className="btn dark" onClick={() => removeItem(index)}>Remove Media</button>
      </div>
    ))}
  </div>;
}
