'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccountModal } from '../../../../components/AccountModalProvider';
import SitePreview from '../../../../lib/SitePreview.js';
import { templateLibrary, getTemplate, pageOptions, planSectionLimit } from '../../../../lib/siteDefaults';

function editorPath(slug = '') {
  const clean = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  return clean ? `/customer/edit/${clean}` : '/customer';
}

export default function Edit() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { accountState, openAccountModal, refreshSession } = useAccountModal();
  const [site, setSite] = useState(null);
  const [msg, setMsg] = useState('Checking your secure customer session…');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOwnedWebsite() {
      if (!slug || accountState === 'checking') return;
      if (accountState !== 'signed-in') {
        setSite(null);
        setMsg('Sign in to edit this website. After sign-in, you will return here safely.');
        return;
      }

      setMsg('Loading your website securely…');
      try {
        const response = await fetch(`/api/site/get?slug=${encodeURIComponent(slug)}&owner=1`, {
          cache: 'no-store',
          credentials: 'same-origin'
        });
        const result = await response.json().catch(() => ({}));
        if (!active) return;
        if (response.status === 401) {
          await refreshSession();
          setSite(null);
          setMsg('Your secure session expired. Sign in again to continue editing.');
          return;
        }
        if (!response.ok || !result.ok) {
          setSite(null);
          setMsg(response.status === 403
            ? 'You do not have access to edit this website.'
            : (result.error || 'The website could not be loaded. Please try again.'));
          return;
        }
        setSite(result.site);
        setMsg('');
      } catch {
        if (!active) return;
        setSite(null);
        setMsg('The website could not be loaded. Please check your connection and try again.');
      }
    }

    loadOwnedWebsite();
    return () => { active = false; };
  }, [accountState, refreshSession, slug]);

  if (!site) {
    const signedOut = accountState !== 'checking' && accountState !== 'signed-in';
    return <main className="wrap dashboard">
      <h1>Customer Editor</h1>
      <p role="status" aria-live="polite">{msg}</p>
      {signedOut && <button
        className="btn"
        type="button"
        onClick={() => openAccountModal({ mode: 'signin', destination: editorPath(slug) })}
      >Sign In and Return to Editor</button>}{' '}
      <a className="btn light" href="/customer">Open My Websites</a>
    </main>;
  }

  const tmpl = getTemplate(site.typeKey, site.styleKey);

  function update(patch) {
    setSite(current => ({ ...current, ...patch }));
  }

  function chooseType(key) {
    const type = templateLibrary.find(item => item.key === key);
    if (!type) return;
    update({
      typeKey: key,
      styleKey: type.styles[0].key,
      pages: type.pages,
      offerTitle: type.title,
      offers: type.offers.map((title, index) => site.offers?.[index] || { title, text: 'Describe this in your own words.' })
    });
  }

  function addPage(page) {
    if (site.pages.includes(page)) return;
    const limit = planSectionLimit(site.plan, site.extraPages || site.extra_pages);
    if (site.pages.length >= limit && site.plan !== 'premium') {
      setMsg('This website is at its current page limit. Save your changes, then use Purchase Extra Page below so the add-on is attached to this website.');
      return;
    }
    update({ pages: [...site.pages, page] });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setMsg('Saving and republishing securely…');
    try {
      const response = await fetch('/api/site/save', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, site })
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        await refreshSession();
        setMsg('Your secure session expired. Sign in again; your changes remain on this screen.');
        return;
      }
      setMsg(response.ok && result.ok
        ? 'Saved and republished. The live website now has your updates.'
        : (response.status === 403 ? 'You do not have access to republish this website.' : (result.error || 'The website could not be saved. Please try again.')));
    } catch {
      setMsg('The website could not be saved. Your changes remain on this screen; please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return <main className="builderShell">
    <aside className="builderSide">
      <h1>Edit Website</h1>
      <p>{slug}.cookiesdigitalcreations.com</p>
      <a className="btn light" target="_blank" rel="noopener noreferrer" href={`https://${slug}.cookiesdigitalcreations.com`}>Open Live Site</a>
      <button className="stepBtn active" type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save & Republish'}</button>
      {msg && <div className="notice" role="status" aria-live="polite">{msg}</div>}
    </aside>
    <section className="builderMain">
      <div className="row">
        <div className="dashboard">
          <h2>Website details</h2>
          <div className="field"><label htmlFor="editor-business-name">Business name</label><input id="editor-business-name" value={site.businessName || ''} onChange={event => update({ businessName: event.target.value })} /></div>
          <div className="field"><label htmlFor="editor-contact-email">Email for contact button</label><input id="editor-contact-email" type="email" value={site.customerEmail || ''} onChange={event => update({ customerEmail: event.target.value })} /></div>
          <div className="field"><label htmlFor="editor-headline">Headline</label><input id="editor-headline" value={site.headline || ''} onChange={event => update({ headline: event.target.value })} /></div>
          <div className="field"><label htmlFor="editor-description">Description</label><textarea id="editor-description" value={site.description || ''} onChange={event => update({ description: event.target.value })} /></div>
          <h3>Template type and look</h3>
          <div className="templateList">{templateLibrary.map(type => <button type="button" className={`pick ${site.typeKey === type.key ? 'active' : ''}`} aria-pressed={site.typeKey === type.key} onClick={() => chooseType(type.key)} key={type.key}>{type.type}</button>)}</div>
          <div className="templateList">{tmpl.type.styles.map(style => <button type="button" className={`pick ${site.styleKey === style.key ? 'active' : ''}`} aria-pressed={site.styleKey === style.key} onClick={() => update({ styleKey: style.key })} key={style.key}><span style={{ fontSize: 30 }} aria-hidden="true">{style.art}</span><br />{style.name}</button>)}</div>
          <div className="row">
            <div className="field"><label htmlFor="editor-main-color">Main color</label><input id="editor-main-color" type="color" value={site.primaryColor || '#20172f'} onChange={event => update({ primaryColor: event.target.value })} /></div>
            <div className="field"><label htmlFor="editor-accent-color">Accent color</label><input id="editor-accent-color" type="color" value={site.accentColor || '#c46a2d'} onChange={event => update({ accentColor: event.target.value })} /></div>
          </div>
          <div className="field"><label htmlFor="editor-offer-title">Offer section title</label><input id="editor-offer-title" value={site.offerTitle || ''} onChange={event => update({ offerTitle: event.target.value })} /></div>
          {(site.offers || []).map((offer, index) => <div className="card" key={index}>
            <h3>Offer Box {index + 1}</h3>
            <label htmlFor={`offer-title-${index}`}>Offer title</label>
            <input id={`offer-title-${index}`} value={offer.title || ''} onChange={event => { const offers = [...site.offers]; offers[index] = { ...offers[index], title: event.target.value }; update({ offers }); }} />
            <label htmlFor={`offer-text-${index}`}>Offer description</label>
            <textarea id={`offer-text-${index}`} value={offer.text || ''} onChange={event => { const offers = [...site.offers]; offers[index] = { ...offers[index], text: event.target.value }; update({ offers }); }} />
          </div>)}
          <h3>Pages</h3>
          {['starter', 'business'].includes(site.plan) && <p><a className="btn light" href={`/builder?checkout=extra&draft=${encodeURIComponent(slug)}`}>Purchase Extra Page</a></p>}
          <div className="templateList">{pageOptions.map(page => <button
            type="button"
            className={`pick ${site.pages?.includes(page) ? 'active' : ''}`}
            aria-pressed={site.pages?.includes(page)}
            key={page}
            onClick={() => site.pages.includes(page) ? page === 'Home' ? null : update({ pages: site.pages.filter(item => item !== page) }) : addPage(page)}
          >{site.pages?.includes(page) ? '✓ ' : ''}{page}</button>)}</div>
          {site.pages.filter(page => page !== 'Home').map(page => <div className="field" key={page}><label htmlFor={`section-${page}`}>{page} wording</label><textarea id={`section-${page}`} value={site.sections?.[page] || ''} onChange={event => update({ sections: { ...site.sections, [page]: event.target.value } })} /></div>)}
          <h3>Media</h3>
          <Media site={site} update={update} />
          <button className="btn" type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save & Republish'}</button>
        </div>
        <div className="previewSticky" aria-label="Updated website preview"><SitePreview site={site} /></div>
      </div>
    </section>
  </main>;
}

async function compressEditorImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)) throw new Error('Upload a JPEG, PNG, or WebP image. SVG, GIF, video, and other files are not supported.');
  if (file.size > 8 * 1024 * 1024) throw new Error('That image is larger than 8 MB. Choose a smaller image.');
  const source = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
  const image = await new Promise((resolve, reject) => { const item = new Image(); item.onload = () => resolve(item); item.onerror = reject; item.src = source; });
  if (!image.width || !image.height || image.width > 6000 || image.height > 6000 || image.width * image.height > 24000000) throw new Error('Use an image no larger than 6000 pixels per side and 24 megapixels.');
  const scale = Math.min(1, 560 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .60);
}

function Media({ site, update }) {
  const sections = ['Gallery', 'Portfolio', 'Projects', 'Before & After', 'Products', 'Menu', 'Services'];
  const selected = sections.filter(section => site.pages?.includes(section));
  const defaultSection = selected[0] || 'Gallery';

  function add() {
    if ((site.media || []).length >= 20) return;
    update({ media: [...(site.media || []), { kind: 'link', url: '', title: '', section: defaultSection }] });
  }

  function set(index, mediaItem) {
    const media = [...(site.media || [])];
    media[index] = mediaItem;
    update({ media });
  }

  function remove(index) {
    update({ media: (site.media || []).filter((_, itemIndex) => itemIndex !== index) });
  }

  async function file(index, uploaded) {
    const count = (site.media || []).filter((item, itemIndex) => itemIndex !== index && item?.kind === 'image' && String(item.url || '').startsWith('data:image/')).length + (String(site.heroImage || '').startsWith('data:image/') ? 1 : 0);
    if (count >= 12) throw new Error('A website can include up to 12 uploaded images. Remove one before adding another.');
    const url = await compressEditorImage(uploaded);
    const safeName = String(uploaded.name || 'Uploaded image').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f<>"'`]/g, '').slice(0, 100);
    set(index, { ...(site.media || [])[index], kind: 'image', url, title: (site.media || [])[index]?.title || safeName, section: (site.media || [])[index]?.section || defaultSection });
  }

  return <div>
    {(site.media || []).map((mediaItem, index) => <div className="card" key={index}>
      <div className="field"><label htmlFor={`media-title-${index}`}>Media title</label><input id={`media-title-${index}`} placeholder="Title" value={mediaItem.title || ''} onChange={event => set(index, { ...mediaItem, title: event.target.value })} /></div>
      <div className="field"><label htmlFor={`media-section-${index}`}>Show in section</label><select id={`media-section-${index}`} value={mediaItem.section || defaultSection} onChange={event => set(index, { ...mediaItem, section: event.target.value })}>{(selected.length ? selected : sections).map(section => <option key={section}>{section}</option>)}</select></div>
      <div className="field"><label htmlFor={`media-kind-${index}`}>Media type</label><select id={`media-kind-${index}`} value={mediaItem.kind || 'link'} onChange={event => set(index, { ...mediaItem, kind: event.target.value, url: '' })}><option value="link">Media/video link</option><option value="image">Image upload</option></select></div>
      {mediaItem.kind === 'image'
        ? <div className="field"><label htmlFor={`media-file-${index}`}>Upload image</label><input id={`media-file-${index}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={async event => { try { if (event.target.files?.[0]) await file(index, event.target.files[0]); } catch (error) { window.alert(error.message); } }} /><small>JPEG, PNG, or WebP; up to 8 MB and 6000 pixels per side.</small>{mediaItem.url && <img className="miniMediaPreview" src={mediaItem.url} alt={mediaItem.title || 'Uploaded media'} />}</div>
        : <div className="field"><label htmlFor={`media-url-${index}`}>Video or media link</label><input id={`media-url-${index}`} placeholder="https://..." value={mediaItem.url || ''} onChange={event => set(index, { ...mediaItem, url: event.target.value })} /></div>}
      <button className="btn dark" type="button" onClick={() => remove(index)}>Remove media</button>
    </div>)}
    <button className="btn dark" type="button" onClick={add} disabled={(site.media || []).length >= 20}>Add Media</button>
  </div>;
}
