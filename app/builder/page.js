'use client';

import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import SitePreview from '../../lib/SitePreview';
import { createDefaultSite, templateLibrary, getTemplate, pageOptions, plans, slugify, sectionPrompts, normalizeSelectedPagesForPlan, planAllowsMedia, planAllowsAiVideo, planSectionLimit, customerActionLimit, customerActionTypes, normalizeCustomerActions } from '../../lib/siteDefaults';

const checkout = {
  starter: '/checkout/starter',
  business: '/checkout/business',
  premium: '/checkout/premium',
  extra: '/checkout/extra'
};

const DRAFT_KEY = 'cookieDraftSite';
const LAST_STEP_KEY = 'cookieBuilderStep';
const CURRENT_DRAFT_SLUG_KEY = 'cookieBuilderCurrentSlug';
const DRAFTS_INDEX_KEY = 'cookieDraftSitesIndex';

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

function draftSlugFor(draft = {}) {
  return slugify(draft.slug || draft.draftName || draft.businessName || 'my-website');
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
    pages: normalizeSelectedPagesForPlan(Array.isArray(saved?.pages) && saved.pages.length ? saved.pages : base.pages, saved?.plan || base.plan),
    desiredPages: Array.isArray(saved?.desiredPages) && saved.desiredPages.length ? saved.desiredPages : base.desiredPages
  };
}

function getStyle(typeKey, styleKey) {
  const type = templateLibrary.find(t => t.key === typeKey) || templateLibrary[0];
  return type.styles.find(s => s.key === styleKey) || type.styles[0];
}

async function compressImage(file, maxSize = 900, quality = 0.68) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Please upload an image file.');
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
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function Builder() {
  const [step, setStep] = useState(0);
  const [site, setSite] = useState(() => createDefaultSite());
  const [message, setMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isSmallBuilderScreen, setIsSmallBuilderScreen] = useState(false);
  const deferredSite = useDeferredValue(site);
  const tmpl = useMemo(() => getTemplate(site.typeKey, site.styleKey), [site.typeKey, site.styleKey]);

  useEffect(() => {
    async function restore() {
      const params = new URLSearchParams(window.location.search);
      const draftSlug = normalizeSlug(params.get('draft') || params.get('slug') || '');
      if (draftSlug && draftSlug !== 'my-website') {
        setSaveMessage('Opening saved draft...');
        try {
          const res = await fetch(`/api/site/get?slug=${encodeURIComponent(draftSlug)}`);
          const data = await res.json();
          if (data.ok && data.site) {
            const merged = mergeDefaults(data.site);
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
        setSite(mergeDefaults(saved));
        localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draftSlugFor(saved));
        if (!Number.isNaN(savedStep)) setStep(Math.min(4, Math.max(0, savedStep)));
        setSaveMessage('Draft restored from this browser.');
      }
    }
    restore();
  }, []);

  useEffect(() => {
    function checkSize() {
      setIsSmallBuilderScreen(window.innerWidth <= 980);
    }
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    // Slower, lightweight autosave keeps the builder from freezing while typing or uploading images.
    const handle = setTimeout(() => persistLocal('Draft auto-saved.', true), 13000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, step]);

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
    setSite(current => mergeDefaults({
      ...ns,
      businessName: current.businessName,
      customerEmail: current.customerEmail,
      phone: current.phone,
      plan: current.plan,
      headline: current.headline && current.headline !== 'A beautiful website created in minutes.' ? current.headline : ns.headline,
      description: current.description && current.description !== 'Add your business details, services, products, and contact information so customers know what you offer.' ? current.description : ns.description,
      heroImage: current.heroImage,
      heroMediaLink: current.heroMediaLink,
      media: current.media || [],
      customerActions: current.customerActions || ns.customerActions,
      ...preset,
      primaryColor: palette.primary || current.primaryColor,
      accentColor: palette.accent || current.accentColor,
      pages: normalizeSelectedPagesForPlan(ns.pages, current.plan),
      desiredPages: type.pages,
      offerTitle: ns.offerTitle,
      offers: ns.offers,
      sections: ns.sections,
      designUpdatedAt: Date.now()
    }));
    setMessage('Website type changed and starter wording/sections were refreshed for that type.');
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

  function planLimit() { return planSectionLimit(site.plan); }

  function addPage(page) {
    if (site.pages.includes(page)) return;
    const limit = planLimit();
    if (site.pages.length >= limit && site.plan !== 'premium') {
      setMessage(`${plans[site.plan]?.label} includes ${limit} selected section(s). Extra sections/pages are $10/month each. Sending you to the add-on checkout.`);
      persistLocal('Draft saved before extra page checkout.');
      setTimeout(() => { window.location.href = checkout.extra; }, 550);
      return;
    }
    update({ pages: normalizeSelectedPagesForPlan([...site.pages, page], site.plan) });
  }

  function removePage(page) {
    if (page === 'Home') return;
    update({ pages: site.pages.filter(p => p !== page) });
  }

  function startNewDraft() {
    const ok = window.confirm('Start a fresh website draft? Your current draft is already saved in this browser if autosave ran, but click Cancel if you want to manually Save Draft first.');
    if (!ok) return;
    localStorage.removeItem(DRAFT_KEY);
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
    setSite(current => current.pages.includes(section) ? current : { ...current, pages: normalizeSelectedPagesForPlan([...current.pages, section], current.plan) });
    setSaveMessage(`${section} was added to your selected sections so the media can show in the preview.`);
    return true;
  }

  function persistLocal(note = 'Draft saved in this browser.', silent = false) {
    try {
      const lightDraft = stripHeavyLocalData(site);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(lightDraft));
      localStorage.setItem(LAST_STEP_KEY, String(step));
      localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draftSlugFor(lightDraft));
      saveLocalDraftIndex(lightDraft);
      if (!silent) setSaveMessage(`${note} ${nowStamp()}`);
    } catch (e) {
      if (!silent) setSaveMessage('Draft text saved best with smaller images. Click Save Draft to save online, or use media links for large visuals.');
    }
  }

  async function saveDraftOnline(draft, quiet = false) {
    const res = await fetch('/api/site/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: draft })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Online draft save failed.');
    if (!quiet) setSaveMessage(`Draft saved online. Find it later from My Website using your email or this name: ${data.slug}. ${nowStamp()}`);
    return data;
  }

  async function saveDraft() {
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan), slug: draftSlugFor(site), draftName: site.draftName || site.businessName, status: 'draft' };
    setIsSaving(true);
    setSaveMessage('Saving draft...');
    try {
      const lightDraft = stripHeavyLocalData(draft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(lightDraft));
      localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draft.slug);
      saveLocalDraftIndex(lightDraft);
      await saveDraftOnline(draft);
    } catch (e) {
      setSaveMessage(`Draft saved lightly in this browser. Online draft could not save: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function goVideo() {
    if (!planAllowsAiVideo(site.plan)) {
      persistLocal('Draft saved before viewing AI Video upgrade options.');
      setMessage('AI Video Studio is available on Business and Premium. Upgrade to unlock real AI video creation.');
      setTimeout(() => { window.location.href = '/pricing?upgrade=ai-video'; }, 650);
      return;
    }
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan), slug: draftSlugFor(site), draftName: site.draftName || site.businessName, status: 'draft' };
    persistLocal('Draft saved before opening AI Video Studio.');
    saveLocalDraftIndex(draft);
    setSaveMessage('Saving your draft before opening AI Video Studio...');
    try { await saveDraftOnline(draft, true); } catch {}
    window.location.href = `/video-studio?return=builder&draft=${encodeURIComponent(draft.slug)}`;
  }

  async function publishFree() {
    const published = { ...site, slug: draftSlugFor(site), draftName: site.draftName || site.businessName, pages: normalizeSelectedPagesForPlan(site.pages, 'free'), plan: 'free', status: 'published' };
    try { const lightPublished = stripHeavyLocalData(published); localStorage.setItem(DRAFT_KEY, JSON.stringify(lightPublished)); localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, published.slug); saveLocalDraftIndex(lightPublished); } catch {}
    setMessage('Publishing free launch page...');
    try {
      const res = await fetch('/api/site/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: published })
      });
      const data = await res.json();
      if (data.ok) window.location.href = '/checkout/success?paid=free';
      else setMessage(data.error || 'Publish failed.');
    } catch (e) {
      setMessage(`Publish failed: ${e.message}`);
    }
  }

  async function checkoutPlan() {
    const draft = { ...site, pages: normalizeSelectedPagesForPlan(site.pages, site.plan), slug: draftSlugFor(site), draftName: site.draftName || site.businessName, status: 'draft' };
    try { const lightDraft = stripHeavyLocalData(draft); localStorage.setItem(DRAFT_KEY, JSON.stringify(lightDraft)); localStorage.setItem(CURRENT_DRAFT_SLUG_KEY, draft.slug); saveLocalDraftIndex(lightDraft); } catch {}
    setMessage('Saving your draft before checkout. If checkout opens, your draft was saved.');
    try { await saveDraftOnline(draft, true); } catch {}
    const url = checkout[site.plan];
    if (!url) { setMessage('Checkout route missing.'); return; }
    window.location.href = url;
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

  const selectedSections = normalizeSelectedPagesForPlan(site.pages, site.plan);
  const selectedCount = selectedSections.length;
  const limitText = plans[site.plan]?.maxPages >= 99 ? 'all built-in sections' : `${planLimit()} selected section(s)`;
  const canUseMedia = planAllowsMedia(site.plan);
  const canUseAiVideo = planAllowsAiVideo(site.plan);
  const previewSite = { ...deferredSite, pages: normalizeSelectedPagesForPlan(deferredSite.pages, deferredSite.plan) };

  const previewKey = `${site.typeKey}-${site.styleKey}-${site.primaryColor}-${site.accentColor}-${site.fontStyle}-${site.layoutStyle}-${site.backgroundStyle}-${site.sectionShape}-${site.templateAppliedAt || ''}-${site.designUpdatedAt || ''}-${JSON.stringify(site.customerActions || [])}`;

  return (
    <main className="builderShell">
      <aside className="builderSide">
        <h1>Cookie Mini Website Builder Pro</h1>
        {['Choose Type & Look','Website Info','Design','Sections & Wording','Preview & Publish'].map((label, index) => (
          <button className={`stepBtn ${step === index ? 'active' : ''}`} onClick={() => { persistLocal('Draft saved.'); setStep(index); }} key={label}>{index + 1}. {label}</button>
        ))}
        <div className="notice">Any issues, click the Contact Us button for help.</div>
        <button className="btn light" onClick={saveDraft} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Draft'}</button>
        {isSmallBuilderScreen && <button className="btn" onClick={() => setIsMobilePreviewOpen(true)}>Open Live Preview</button>}
        {planAllowsAiVideo(site.plan) ? <button className="btn light" onClick={goVideo}>AI Video Studio</button> : <button className="btn light lockedBtn" onClick={goVideo}>AI Video Upgrade</button>}
        <a className="btn light" href="/customer">Open My Drafts</a>
        <button className="btn light" onClick={startNewDraft}>Start Fresh Draft</button>
        <div className="notice smallNotice"><strong>Current draft:</strong><br />{draftSlugFor(site)}.cookiesdigitalcreations.com</div>
        {saveMessage && <div className="notice smallNotice">{saveMessage}</div>}
      </aside>

      <section className="builderMain">
        <div className="row builderTwoCol">
          <div className="dashboard builderPanel">
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
                <p className="mutedText">Change the website type, template look, colors, layout, hero image, and media. Template changes apply immediately to the preview.</p>
                <Field label="Plan"><select value={site.plan} onChange={e => update({ plan: e.target.value, pages: e.target.value === 'free' ? ['Home'] : site.pages })}>{Object.entries(plans).map(([k, v]) => <option value={k} key={k}>{v.label} - {v.price}</option>)}</select></Field>
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
                  <Field label="Upload hero image / website visual"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadHero(e.target.files[0])} />{site.heroImage && <button className="btn dark" onClick={() => update({ heroImage: '' })}>Remove Uploaded Image</button>}</Field>
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
                <div className="templateList pagePickList sectionPickList">
                  {pageOptions.map(page => {
                    const isSelected = selectedSections.includes(page);
                    const isHome = page === 'Home';
                    const isAtLimit = !isSelected && plans[site.plan]?.maxPages < 99 && selectedCount >= planLimit();
                    return (
                      <button
                        className={`pick ${isSelected ? 'active' : ''} ${isAtLimit ? 'lockedPick' : ''}`}
                        key={page}
                        disabled={isAtLimit || (isHome && isSelected)}
                        onClick={() => isSelected ? removePage(page) : addPage(page)}
                        title={isAtLimit ? 'Upgrade or remove another section first.' : ''}
                      >
                        {isSelected ? '✓ ' : ''}{page}{isHome ? ' (required)' : ''}<br />
                        <small>{isAtLimit ? 'Plan limit reached. Upgrade or remove another selected section.' : sectionPrompts[page]}</small>
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
                <button className="btn dark" onClick={saveDraft}>Save Draft / Continue Later</button>{' '}<a className="btn dark" href="/customer">Open My Drafts</a>{' '}
                {site.plan === 'free' ? <button className="btn" onClick={publishFree}>Publish Free Page</button> : <button className="btn" onClick={checkoutPlan}>Go to {plans[site.plan]?.price} Checkout</button>}
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
  return <div className="field"><label>{label}</label>{help && <small>{help}</small>}{children}</div>;
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
  const [quick, setQuick] = useState({ title: '', section: 'Gallery', url: '' });

  function setMedia(next) { update({ media: next }); }
  function addImageSlot(section = 'Gallery') { ensureMediaSection?.(section); setMedia([...media, { kind: 'image', url: '', title: '', section }]); }
  function addLinkSlot(section = 'Gallery') { ensureMediaSection?.(section); setMedia([...media, { kind: 'link', url: '', title: '', section }]); }
  function addQuickLink() {
    if (!quick.url.trim()) { setSaveMessage('Paste a media/video link first.'); return; }
    ensureMediaSection?.(quick.section);
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
      const image = await compressImage(file, 560, 0.60);
      updateItem(index, { kind: 'image', url: image, title: media[index]?.title || file.name });
      setSaveMessage('Gallery image added. Click Save Draft to keep it online.');
    } catch (e) {
      setSaveMessage(e.message || 'Gallery image upload failed.');
    }
  }
  async function uploadQuick(file) {
    setSaveMessage('Preparing uploaded image...');
    try {
      const image = await compressImage(file, 560, 0.60);
      ensureMediaSection?.(quick.section);
      setMedia([...media, { kind: 'image', url: image, title: quick.title || file.name, section: quick.section }]);
      setQuick({ ...quick, title: '' });
      setSaveMessage('Image added to media section.');
    } catch (e) {
      setSaveMessage(e.message || 'Image upload failed.');
    }
  }

  const sections = ['Gallery','Portfolio','Projects','Before & After','Products','Menu'];
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
      <Field label="Upload image to this section"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadQuick(e.target.files[0])} /></Field>
      <div className="row">
        <Field label="Or paste video/media link"><input placeholder="https://youtube.com/..." value={quick.url} onChange={e => setQuick({ ...quick, url: e.target.value })} /></Field>
        <div className="field mediaButtonField"><label>&nbsp;</label><button className="btn dark" onClick={addQuickLink}>Add Media Link</button></div>
      </div>
    </div>

    <div className="navRow">
      <button className="btn dark" onClick={() => addImageSlot('Gallery')}>Add Empty Image Slot</button>
      <button className="btn dark" onClick={() => addLinkSlot('Gallery')}>Add Empty Video Link Slot</button>
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
          <Field label="Upload image"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadMedia(index, e.target.files[0])} />{item.url && <img className="miniMediaPreview" src={item.url} alt={item.title || 'media preview'} />}</Field>
        ) : (
          <Field label="Video/social/media URL"><input placeholder="https://youtube.com/..." value={item.url || ''} onChange={e => updateItem(index, { url: e.target.value })} /></Field>
        )}
        <button className="btn dark" onClick={() => removeItem(index)}>Remove Media</button>
      </div>
    ))}
  </div>;
}
