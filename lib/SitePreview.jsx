import React from 'react';
import { getTemplate, plans, visiblePagesForPlan } from './siteDefaults';

function sectionText(site, page) {
  return site.sections?.[page] || '';
}

function idFor(page) {
  return page.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and');
}

export default function SitePreview({ site, live = false, draftMode = false }) {
  const { type, style } = getTemplate(site.typeKey, site.styleKey);
  const pages = draftMode ? (site.pages?.length ? site.pages : ['Home']) : visiblePagesForPlan(site);
  const email = site.customerEmail || site.email || '';
  const contactHref = email ? `mailto:${email}` : '#contact';
  const brand = site.plan === 'free' || plans[site.plan]?.branding;
  const cssVars = { '--primary': site.primaryColor || '#20172f', '--accent': site.accentColor || '#c46a2d' };
  return (
    <article className={`sitePreview ${type.key} ${style.key}`} style={cssVars}>
      {draftMode && site.plan === 'free' && site.pages?.length > 1 && (
        <div className="draftBanner">Draft preview: Free Launch Page publishes Home only. Upgrade to publish extra pages.</div>
      )}
      <header className="siteTop">
        <strong>{site.businessName || 'My Business Name'}</strong>
        <nav>
          {pages.map(p => <a key={p} href={`#${idFor(p)}`}>{p}</a>)}
        </nav>
      </header>
      <section className="hero" id="home">
        <div className="heroText">
          <span className="eyebrow">{type.type}</span>
          <h1>{site.headline}</h1>
          <p>{site.description}</p>
          {sectionText(site, 'Home') && <p className="homeExtra">{sectionText(site, 'Home')}</p>}
          <a className="cta" href={contactHref}>Contact Now</a>
        </div>
        <div className="artCard" aria-label={`${style.name} artwork`}>
          {site.heroImage ? (
            <img className="heroUploadImage" src={site.heroImage} alt="Uploaded website visual" />
          ) : (
            <>
              <div className="artGlow" />
              <div className="artIcon">{style.art}</div>
              <strong>{style.name}</strong>
              <p>{style.visual || style.mood}</p>
            </>
          )}
          {site.heroMediaLink && <a className="mediaLink" href={site.heroMediaLink} target="_blank" rel="noreferrer">Open video/media link</a>}
        </div>
      </section>
      <section className="offers" id="services">
        <span className="sectionKicker">{type.type}</span>
        <h2>{site.offerTitle || 'Services & Offers'}</h2>
        <div className="offerGrid">
          {(site.offers || []).slice(0, 3).map((offer, index) => (
            <div className="offerCard" key={index}>
              <h3>{offer.title}</h3>
              <p>{offer.text}</p>
            </div>
          ))}
        </div>
      </section>
      {pages.filter(p => p !== 'Home').map(page => (
        <section className="contentSection" id={idFor(page)} key={page}>
          <h2>{page}</h2>
          <p>{sectionText(site, page)}</p>
          {['Gallery','Portfolio','Projects','Before & After','Products','Menu'].includes(page) && (site.media || []).filter(m => (m.section || 'Gallery') === page || (!m.section && page === 'Gallery')).filter(m => m.url).length > 0 && (
            <div className="mediaGrid">
              {(site.media || []).filter(m => (m.section || 'Gallery') === page || (!m.section && page === 'Gallery')).filter(m => m.url).slice(0, 12).map((m, i) => (
                <div className="mediaItem" key={i}>
                  {m.kind === 'image' ? <img src={m.url} alt={m.title || 'media'} /> : <a href={m.url} target="_blank" rel="noreferrer">▶ {m.title || 'Open media'}</a>}
                  {m.title && <small>{m.title}</small>}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      <footer className="siteFooter">
        <p>© {new Date().getFullYear()} {site.businessName}</p>
        {brand && <p className="brandBadge">Built with Cookie Mini Website Builder</p>}
      </footer>
    </article>
  );
}
