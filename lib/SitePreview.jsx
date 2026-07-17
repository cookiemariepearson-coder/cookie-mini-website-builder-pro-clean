import React from 'react';
import { getTemplate, plans, visiblePagesForPlan } from './siteDefaults';

function sectionText(site, page) {
  return site.sections?.[page] || '';
}

export default function SitePreview({ site, live = false }) {
  const { type, style } = getTemplate(site.typeKey, site.styleKey);
  const pages = visiblePagesForPlan(site);
  const email = site.customerEmail || site.email || '';
  const contactHref = email ? `mailto:${email}` : '#contact';
  const brand = site.plan === 'free' || plans[site.plan]?.branding;
  const cssVars = { '--primary': site.primaryColor || '#20172f', '--accent': site.accentColor || '#c46a2d' };
  return (
    <article className={`sitePreview ${type.key} ${style.key}`} style={cssVars}>
      <header className="siteTop">
        <strong>{site.businessName || 'My Business Name'}</strong>
        <nav>
          {pages.map(p => <a key={p} href={`#${p.toLowerCase().replaceAll(' ', '-')}`}>{p}</a>)}
        </nav>
      </header>
      <section className="hero" id="home">
        <div className="heroText">
          <span className="eyebrow">{type.type}</span>
          <h1>{site.headline}</h1>
          <p>{site.description}</p>
          <a className="cta" href={contactHref}>Contact Now</a>
        </div>
        <div className="artCard" aria-label={`${style.name} artwork`}>
          <div className="artGlow" />
          <div className="artIcon">{style.art}</div>
          <strong>{style.name}</strong>
          <p>{style.mood}</p>
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
        <section className="contentSection" id={page.toLowerCase().replaceAll(' ', '-')} key={page}>
          <h2>{page}</h2>
          <p>{sectionText(site, page)}</p>
          {['Gallery','Portfolio','Projects','Before & After','Products','Menu'].includes(page) && site.media?.length > 0 && (
            <div className="mediaGrid">
              {site.media.slice(0, 12).map((m, i) => (
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
