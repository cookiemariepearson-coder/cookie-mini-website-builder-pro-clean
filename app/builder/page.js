'use client';

import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import SitePreview from '../../lib/SitePreview';
import { createDefaultSite, templateLibrary, getTemplate, pageOptions, plans, slugify, sectionPrompts } from '../../lib/siteDefaults';

const checkout = {
  starter: '/checkout/starter',
  business: '/checkout/business',
  premium: '/checkout/premium',
  extra: '/checkout/extra'
};

const DRAFT_KEY = 'cookieDraftSite';
const LAST_STEP_KEY = 'cookieBuilderStep';

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

function mergeDefaults(saved) {
  const base = createDefaultSite({ typeKey: saved?.typeKey || 'local', styleKey: saved?.styleKey });
  return {
    ...base,
    ...saved,
    sections: { ...base.sections, ...(saved?.sections || {}) },
    offers: Array.isArray(saved?.offers) && saved.offers.length ? saved.offers : base.offers,
    media: Array.isArray(saved?.media) ? saved.media : []
  };
}

function getStyle(typeKey, styleKey) {
  const type = templateLibrary.find(t => t.key === typeKey) || templateLibrary[0];
  return type.styles.find(s => s.key === styleKey) || type.styles[0];
}

async function compressImage(file, maxSize = 1200, quality = 0.78) {
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
      const savedStep = Number(localStorage.getItem(LAST_STEP_KEY) || 0);
      if (saved) {
        setSite(mergeDefaults(saved));
        if (!Number.isNaN(savedStep)) setStep(Math.min(4, Math.max(0, savedStep)));
        setSaveMessage('Draft restored from this browser.');
      }
    }
    restore();
  }, []);

  useEffect(() => {
    // Slower autosave prevents freezing while typing or after image uploads.
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(site));
        localStorage.setItem(LAST_STEP_KEY, String(step));
      } catch (e) {
        setSaveMessage('Draft is too large for browser storage. Use media links or smaller images.');
      }
    }, 1400);
    return () => clearTimeout(handle);
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

  function chooseType(key) {
    const type = templateLibrary.find(t => t.key === key) || templateLibrary[0];
    const ns = createDefaultSite({ typeKey: key, styleKey: type.styles[0].key });
    const palette = type.styles[0].palette || {};
    setSite(current => mergeDefaults({
      ...ns,
      businessName: current.businessName,
      customerEmail: current.customerEmail,
      phone: current.phone,
      plan: current.plan,
      headline: current.headline,
      description: current.description,
      heroImage: current.heroImage,
      heroMediaLink: current.heroMediaLink,
      media: current.media || [],
      sections: { ...ns.sections, ...(current.sections || {}) },
      primaryColor: palette.primary || current.primaryColor,
      accentColor: palette.accent || current.accentColor,
      pages: current.plan === 'free' ? ['Home'] : ['Home'],
      desiredPages: type.pages
    }));
    setMessage('Website type changed. Choose a visual look, then continue adding your wording.');
  }

  function selectStyle(key) {
    const style = getStyle(site.typeKey, key);
    setSite(current => ({
      ...current,
      styleKey: key,
      primaryColor: style.palette?.primary || current.primaryColor,
      accentColor: style.palette?.accent || current.accentColor,
      templateAppliedAt: Date.now()
    }));
    setMessage(`Template look changed to ${style.name}.`);
  }

  function planLimit() { return plans[site.plan]?.maxPages || 1; }

  function addPage(page) {
    if (site.pages.includes(page)) return;
    const limit = planLimit();
    if (site.pages.length >= limit && site.plan !== 'premium') {
      setMessage(`${plans[site.plan]?.label} includes ${limit} page(s). Extra pages are $10/month each. Sending you to the extra-page checkout.`);
      persistLocal('Draft saved before extra page checkout.');
      setTimeout(() => { window.location.href = checkout.extra; }, 550);
      return;
    }
    update({ pages: [...site.pages, page] });
  }

  function removePage(page) {
    if (page === 'Home') return;
    update({ pages: site.pages.filter(p => p !== page) });
  }

  function persistLocal(note = 'Draft saved in this browser.') {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(site));
      localStorage.setItem(LAST_STEP_KEY, String(step));
      setSaveMessage(`${note} ${nowStamp()}`);
    } catch (e) {
      setSaveMessage('Draft is too large for browser storage. Use media links or smaller images.');
    }
  }

  async function saveDraft() {
    const draft = { ...site, slug: slugify(site.businessName) };
    setIsSaving(true);
    setSaveMessage('Saving draft...');
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      const res = await fetch('/api/site/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: draft })
      });
      const data = await res.json();
      setSaveMessage(data.ok ? `Draft saved online. Find it later from My Website using your email or this name: ${data.slug}. ${nowStamp()}` : data.error || 'Draft saved in browser, but online save failed.');
    } catch (e) {
      setSaveMessage(`Draft saved in this browser. Online draft could not save: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function goVideo() {
    persistLocal('Draft saved before opening AI Video Studio.');
    window.location.href = '/video-studio?return=builder';
  }

  async function publishFree() {
    const published = { ...site, slug: slugify(site.businessName), pages: ['Home'], plan: 'free' };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(published)); } catch {}
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

  function checkoutPlan() {
    const draft = { ...site, slug: slugify(site.businessName) };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
    const url = checkout[site.plan];
    if (!url) { setMessage('Checkout route missing.'); return; }
    window.location.href = url;
  }

  async function uploadHero(file) {
    setSaveMessage('Preparing image...');
    try {
      const image = await compressImage(file, 1200, 0.78);
      update({ heroImage: image });
      setSaveMessage('Hero image added.');
    } catch (e) {
      setSaveMessage(e.message || 'Image upload failed.');
    }
  }

  function next() { setStep(s => Math.min(4, s + 1)); persistLocal('Draft saved.'); }
  function back() { setStep(s => Math.max(0, s - 1)); persistLocal('Draft saved.'); }

  return (
    <main className="builderShell">
      <aside className="builderSide">
        <h1>Cookie Mini Website Builder Pro</h1>
        {['Choose Type & Look','Website Info','Design','Pages & Wording','Preview & Publish'].map((label, index) => (
          <button className={`stepBtn ${step === index ? 'active' : ''}`} onClick={() => setStep(index)} key={label}>{index + 1}. {label}</button>
        ))}
        <div className="notice">Any issues, click the Contact Us button for help.</div>
        <button className="btn light" onClick={saveDraft} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Draft'}</button>
        <button className="btn light" onClick={goVideo}>AI Video Studio</button>
        {saveMessage && <div className="notice smallNotice">{saveMessage}</div>}
      </aside>

      <section className="builderMain">
        <div className="row builderTwoCol">
          <div className="dashboard builderPanel">
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
              </>
            )}

            {step === 1 && (
              <>
                <h2>Website Info</h2>
                <p className="mutedText">Enter the words that build the website. The preview updates on the right.</p>
                <Field label="Business / website name"><input value={site.businessName || ''} onChange={e => update({ businessName: e.target.value })} /></Field>
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
                <p className="mutedText">Change the website type, template look, colors, hero image, and media. Template changes now apply immediately to the preview.</p>
                <Field label="Plan"><select value={site.plan} onChange={e => update({ plan: e.target.value, pages: e.target.value === 'free' ? ['Home'] : site.pages })}>{Object.entries(plans).map(([k, v]) => <option value={k} key={k}>{v.label} - {v.price}</option>)}</select></Field>
                <Field label="Website type"><select value={site.typeKey} onChange={e => chooseType(e.target.value)}>{templateLibrary.map(t => <option value={t.key} key={t.key}>{t.type}</option>)}</select></Field>
                <h3>Template look</h3>
                <StylePicker typeKey={site.typeKey} styleKey={site.styleKey} selectStyle={selectStyle} />
                <div className="row">
                  <Field label="Main color"><input type="color" value={site.primaryColor || '#20172f'} onChange={e => update({ primaryColor: e.target.value })} /></Field>
                  <Field label="Accent color"><input type="color" value={site.accentColor || '#c46a2d'} onChange={e => update({ accentColor: e.target.value })} /></Field>
                </div>
                <Field label="Upload hero image / website visual"><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadHero(e.target.files[0])} />{site.heroImage && <button className="btn dark" onClick={() => update({ heroImage: '' })}>Remove Uploaded Image</button>}</Field>
                <Field label="Video or media link for this website"><input placeholder="https://youtube.com/... or TikTok/Instagram/Vimeo link" value={site.heroMediaLink || ''} onChange={e => update({ heroMediaLink: e.target.value })} /></Field>
                <NavRow back={back} next={next} />
              </>
            )}

            {step === 3 && (
              <>
                <h2>Pages & Wording</h2>
                <p className="mutedText">Free publishes Home only. Starter publishes 1 page. Business publishes up to 3 pages. Premium publishes all selected pages.</p>
                <div className="notice"><strong>{plans[site.plan]?.label}</strong> includes {plans[site.plan]?.maxPages >= 99 ? 'all built-in pages' : `${plans[site.plan]?.maxPages} page(s)`}. Extra pages are $10/month per page.</div>
                <div className="templateList pagePickList">
                  {pageOptions.map(page => (
                    <button className={`pick ${site.pages.includes(page) ? 'active' : ''}`} key={page} onClick={() => site.pages.includes(page) ? removePage(page) : addPage(page)}>
                      {site.pages.includes(page) ? '✓ ' : ''}{page}<br />
                      <small>{sectionPrompts[page]}</small>
                    </button>
                  ))}
                </div>
                <h3>Write section wording</h3>
                {site.pages.map(page => (
                  <Field label={`${page} wording`} help={sectionPrompts[page]} key={page}>
                    <textarea value={site.sections?.[page] || ''} onChange={e => updateSection(page, e.target.value)} />
                  </Field>
                ))}
                <h3>Gallery / media items</h3>
                <p className="mutedText">Use this for Gallery, Portfolio, Products, Menu, Projects, or Before & After pages. Large videos should be links for now.</p>
                <MediaEditor site={site} update={update} setSaveMessage={setSaveMessage} />
                <NavRow back={back} next={next} />
              </>
            )}

            {step === 4 && (
              <>
                <h2>Preview & Publish</h2>
                {message && <div className="notice error">{message}</div>}
                <p>Your website name will be:</p>
                <div className="notice"><strong>{slugify(site.businessName)}.cookiesdigitalcreations.com</strong></div>
                <button className="btn dark" onClick={saveDraft}>Save Draft / Continue Later</button>{' '}<a className="btn dark" href="/customer">Open My Drafts</a>{' '}
                {site.plan === 'free' ? <button className="btn" onClick={publishFree}>Publish Free Page</button> : <button className="btn" onClick={checkoutPlan}>Go to {plans[site.plan]?.price} Checkout</button>}
                <div className="navRow"><button className="btn dark" onClick={back}>Back</button></div>
              </>
            )}
          </div>

          <div className="previewSticky">
            <div className="previewTitle"><strong>Live Draft Preview</strong><span>Updates as you build</span></div>
            <SitePreview key={`${site.typeKey}-${site.styleKey}-${site.primaryColor}-${site.accentColor}-${site.templateAppliedAt || ''}`} site={deferredSite} draftMode />
          </div>
        </div>
      </section>
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
  return <div className="templateList stylePickList">{type.styles.map(style => (
    <button className={`pick styleCard ${styleKey === style.key ? 'active' : ''}`} onClick={() => selectStyle(style.key)} key={style.key}>
      <span className="styleIcon">{style.art}</span>
      <strong>{style.name}</strong>
      <small>{style.visual || style.mood}</small>
      <span className="stylePalette" style={{ background: `linear-gradient(135deg, ${style.palette?.primary || '#20172f'}, ${style.palette?.accent || '#c46a2d'})` }} />
      <em>Apply this look</em>
    </button>
  ))}</div>;
}

function MediaEditor({ site, update, setSaveMessage }) {
  const media = site.media || [];

  function setMedia(next) { update({ media: next }); }
  function addImage() { setMedia([...media, { kind: 'image', url: '', title: '', section: 'Gallery' }]); }
  function addLink() { setMedia([...media, { kind: 'link', url: '', title: '', section: 'Gallery' }]); }
  function updateItem(index, patch) {
    const next = [...media];
    next[index] = { ...next[index], ...patch };
    setMedia(next);
  }
  function removeItem(index) { setMedia(media.filter((_, i) => i !== index)); }
  async function uploadMedia(index, file) {
    setSaveMessage('Preparing gallery image...');
    try {
      const image = await compressImage(file, 1000, 0.76);
      updateItem(index, { kind: 'image', url: image, title: media[index]?.title || file.name });
      setSaveMessage('Gallery image added.');
    } catch (e) {
      setSaveMessage(e.message || 'Gallery image upload failed.');
    }
  }

  return <div className="mediaEditor">
    <div className="navRow">
      <button className="btn dark" onClick={addImage}>Add Uploaded Image</button>
      <button className="btn dark" onClick={addLink}>Add Video / Media Link</button>
    </div>
    {media.length === 0 && <div className="notice">No media added yet. Add an uploaded image or a video/media link.</div>}
    {media.map((item, index) => (
      <div className="card miniCard mediaCard" key={index}>
        <div className="row">
          <Field label="Media title"><input placeholder="Example: Featured product, Before photo, Food plate" value={item.title || ''} onChange={e => updateItem(index, { title: e.target.value })} /></Field>
          <Field label="Show in section"><select value={item.section || 'Gallery'} onChange={e => updateItem(index, { section: e.target.value })}>{['Gallery','Portfolio','Projects','Before & After','Products','Menu'].map(p => <option key={p}>{p}</option>)}</select></Field>
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
