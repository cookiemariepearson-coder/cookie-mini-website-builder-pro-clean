import React from 'react';
import { getTemplate, plans, visiblePagesForPlan } from './siteDefaults';


const visualScenes = {
  food: ['🍳','🥘','🍽️','🔥'],
  beauty: ['🌸','💇🏾‍♀️','💄','✨'],
  realestate: ['🏢','🏡','🌆','📈'],
  wellness: ['🌿','🌺','🍵','☀️'],
  local: ['🏪','🛠️','📍','⭐'],
  digital: ['💻','📱','⚙️','🚀'],
  nonprofit: ['🤝','🌍','📣','💛'],
  creator: ['🎬','🎥','🎨','⭐'],
  cleaning: ['✨','🧽','🏠','💧'],
  coaching: ['📘','💼','📊','🎯'],
  party: ['🎈','🎉','🎁','🌈'],
  shop: ['🛍️','👗','🏬','💎']
};

const styleEffects = {
  'kitchen-realistic': ['steam','warm plate','recipe cards'],
  'cartoon-food': ['cartoon menu','bold labels','playful shapes'],
  'floral-glam': ['floral frame','soft glow','beauty sparkle'],
  'luxury-salon': ['gold mirror','gloss shine','premium booking'],
  'building-pro': ['city skyline','property grid','trust badges'],
  'modern-property': ['3D home cards','clean map','investor panel'],
  'flowers-herbs': ['herbal border','flower accent','calm glow'],
  'clean-minimal': ['clean product','soft cards','calm space'],
  'service-3d': ['3D tools','booking card','local badge'],
  'service-realistic': ['storefront','map pin','reviews'],
  'bold-sales': ['product mockups','sales badge','buy button'],
  'creator-tool': ['3D dashboard','app cards','creator tools'],
  'warm-mission': ['community cards','warm mission','support blocks'],
  'bold-action': ['action banner','impact cards','donate prompt'],
  cinematic: ['film strip','spotlight','portfolio reel'],
  'cartoon-creative': ['cartoon shapes','bright project cards','creator art'],
  'clean-realistic': ['sparkle room','before/after cards','trust icons'],
  'cartoon-sparkle': ['cleaning bubbles','cartoon sparkle','friendly icons'],
  'expert-clean': ['profile card','strategy blocks','calm expert'],
  'luxury-advisor': ['gold cards','advisor badge','premium panel'],
  'cartoon-bright': ['balloons','party cards','fun colors'],
  'color-pop': ['bold shapes','event blocks','bright badges'],
  'luxury-product': ['product shelf','boutique glow','premium cards'],
  'storefront-realistic': ['storefront','product grid','shop window']
};

function TemplateArtwork({ type, style }) {
  const icons = visualScenes[type.key] || ['✨','⭐','💻','📌'];
  const effects = styleEffects[style.key] || [style.name, style.visual || style.mood, 'custom layout'];
  return (
    <div className={`templateArtwork theme-${type.key} look-${style.key}`}>
      <div className="templateGlowOne" />
      <div className="templateGlowTwo" />
      <div className="templateMockBrowser">
        <span></span><span></span><span></span>
        <strong>{style.name}</strong>
      </div>
      <div className="templateVisualStack">
        <div className="visualTile primaryTile"><span>{icons[0]}</span></div>
        <div className="visualTile secondaryTile"><span>{icons[1]}</span></div>
        <div className="visualTile miniTile"><span>{icons[2]}</span></div>
        <div className="visualTile miniTile alt"><span>{icons[3]}</span></div>
      </div>
      <div className="templateMiniCards">
        {effects.slice(0,3).map((item, index) => <em key={index}>{item}</em>)}
      </div>
    </div>
  );
}

function sectionText(site, page) {
  return site.sections?.[page] || '';
}

function idFor(page) {
  return page.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and');
}

function styleClasses(site, type, style) {
  return [
    'sitePreview',
    type.key,
    style.key,
    `layout-${site.layoutStyle || 'split'}`,
    `font-${site.fontStyle || 'bold'}`,
    `bg-${site.backgroundStyle || 'gradient'}`,
    `shape-${site.sectionShape || 'cards'}`
  ].join(' ');
}

export default function SitePreview({ site, live = false, draftMode = false }) {
  const { type, style } = getTemplate(site.typeKey, site.styleKey);
  const pages = draftMode ? (site.pages?.length ? site.pages : ['Home']) : visiblePagesForPlan(site);
  const email = site.customerEmail || site.email || '';
  const contactHref = email ? `mailto:${email}` : '#contact';
  const brand = site.plan === 'free' || plans[site.plan]?.branding;
  const cssVars = { '--primary': site.primaryColor || '#20172f', '--accent': site.accentColor || '#c46a2d' };
  const media = Array.isArray(site.media) ? site.media : [];

  return (
    <article className={styleClasses(site, type, style)} style={cssVars}>
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
              <TemplateArtwork type={type} style={style} />
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
              <div className="offerIcon">{index === 0 ? '①' : index === 1 ? '②' : '③'}</div>
              <h3>{offer.title}</h3>
              <p>{offer.text}</p>
            </div>
          ))}
        </div>
      </section>
      {pages.filter(p => p !== 'Home').map(page => {
        const pageMedia = media.filter(m => (m.section || 'Gallery') === page || (!m.section && page === 'Gallery')).filter(m => m.url);
        return (
          <section className="contentSection" id={idFor(page)} key={page}>
            <h2>{page}</h2>
            <p>{sectionText(site, page)}</p>
            {['Gallery','Portfolio','Projects','Before & After','Products','Menu'].includes(page) && pageMedia.length > 0 && (
              <div className="mediaGrid">
                {pageMedia.slice(0, 12).map((m, i) => (
                  <div className="mediaItem" key={i}>
                    {m.kind === 'image' ? <img src={m.url} alt={m.title || 'media'} /> : <a href={m.url} target="_blank" rel="noreferrer">▶ {m.title || 'Open media'}</a>}
                    {m.title && <small>{m.title}</small>}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <footer className="siteFooter">
        <p>© {new Date().getFullYear()} {site.businessName}</p>
        {brand && <p className="brandBadge">Built with Cookie Mini Website Builder</p>}
      </footer>
    </article>
  );
}
