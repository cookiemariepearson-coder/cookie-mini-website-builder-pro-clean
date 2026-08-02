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
  if (type.key === 'food') {
    const coastal = style.key === 'cartoon-food';
    return (
      <div className={`foodHeroArtwork${coastal ? ' coastalFoodHeroArtwork' : ''}`}>
        <div className="foodHeroCaption">
          <strong>{coastal ? 'Fresh from the coast' : 'Fresh from the kitchen'}</strong>
          <span>{coastal ? 'Seafood • Sunset dining • Events' : 'Made to order • Pickup • Catering'}</span>
        </div>
      </div>
    );
  }
  if (type.key === 'beauty') {
    const luxury = style.key === 'luxury-salon';
    return (
      <div className={`beautyHeroArtwork${luxury ? ' luxuryBeautyHeroArtwork' : ''}`}>
        <div className="beautyHeroCaption">
          <strong>{luxury ? 'Luxury looks. Unforgettable confidence.' : 'Polished care. Beautiful results.'}</strong>
          <span>{luxury ? 'Editorial styling • Glam • Private appointments' : 'Hair care • Styling • Appointments'}</span>
        </div>
      </div>
    );
  }
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

function FoodTemplatePromotion({ site, page }) {
  if (site.typeKey !== 'food') return null;
  const hasReplacement = Array.isArray(site.media) && site.media.some(item => item?.section === page && item?.url);
  if (hasReplacement) return null;
  const coastal = site.styleKey === 'cartoon-food';
  if (page === 'Menu') {
    return (
      <div className={`foodMenuPromotion${coastal ? ' coastalFoodMenuPromotion' : ''}`}>
        <header><small>{coastal ? 'Fresh catch menu' : 'Featured menu'}</small><strong>{site.offerTitle || 'Menu & Specials'}</strong></header>
        <div className="foodMenuPromotionItems">
          {(site.offers || []).slice(0, 3).map((offer, index) => <div key={index}><b>{offer.title}</b><span>{offer.text}</span></div>)}
        </div>
        <a className="foodPromotionButton" href="#order-and-book-and-buy">Order Now</a>
      </div>
    );
  }
  if (page === 'Gallery') {
    const galleryCopy = sectionText(site, 'Gallery').trim();
    const customFirstLine = galleryCopy.split('\n').find(Boolean) || '';
    const firstLine = !customFirstLine || /^Add photos,?\s+video links/i.test(customFirstLine)
      ? 'Plan your next food event'
      : customFirstLine.slice(0, 72);
    return (
      <div className={`foodEventPromotion${coastal ? ' coastalFoodEventPromotion' : ''}`}>
        <div><small>{coastal ? 'Seafood • Sunsets • Celebrations' : 'Food • Music • Community'}</small><strong>{firstLine}</strong><span>Add your date, location, special offer, and event details in the Gallery wording.</span></div>
        <a className="foodPromotionButton" href="#contact">Contact Us</a>
      </div>
    );
  }
  return null;
}

function BeautyTemplatePromotion({ site, page }) {
  if (site.typeKey !== 'beauty') return null;
  const hasReplacement = Array.isArray(site.media) && site.media.some(item => item?.section === page && item?.url);
  if (hasReplacement) return null;
  const luxury = site.styleKey === 'luxury-salon';
  if (page === 'Services') {
    return (
      <div className={`beautyServicesPromotion${luxury ? ' luxuryBeautyServicesPromotion' : ''}`}>
        <header><small>{luxury ? 'Midnight luxury services' : 'Our signature services'}</small><strong>{site.offerTitle || 'Beauty Services'}</strong></header>
        <div className="beautyServicesPromotionItems">
          {(site.offers || []).slice(0, 3).map((offer, index) => <div key={index}><b>{offer.title}</b><span>{offer.text}</span></div>)}
        </div>
        <a className="beautyPromotionButton" href="#contact">Book an Appointment</a>
      </div>
    );
  }
  if (page === 'Gallery') {
    const galleryCopy = sectionText(site, 'Gallery').trim();
    const customFirstLine = galleryCopy.split('\n').find(Boolean) || '';
    const firstLine = !customFirstLine || /^Add photos,?\s+video links/i.test(customFirstLine)
      ? 'Styles created for every kind of beauty'
      : customFirstLine.slice(0, 72);
    return (
      <div className={`beautyGalleryPromotion${luxury ? ' luxuryBeautyGalleryPromotion' : ''}`}>
        <div><small>{luxury ? 'The evening edit' : 'Salon gallery'}</small><strong>{firstLine}</strong><span>Add your own work, transformation photos, and appointment message in the Gallery section.</span></div>
        <a className="beautyPromotionButton" href="#contact">Reserve Your Style</a>
      </div>
    );
  }
  return null;
}

function RealEstateTemplatePromotion({ site, page }) {
  if (site.typeKey !== 'realestate') return null;
  const hasReplacement = Array.isArray(site.media) && site.media.some(item => item?.section === page && item?.url);
  if (hasReplacement) return null;
  const residential = site.styleKey === 'modern-property';
  if (page === 'Services') {
    return (
      <div className={`realEstateServicesPromotion ${residential ? 'residentialRealEstateServices' : 'commercialRealEstateServices'}`}>
        <header><small>{residential ? 'Home buying made clearer' : 'Commercial property strategy'}</small><strong>{site.offerTitle || 'Real Estate Services'}</strong></header>
        <div className="realEstatePromotionItems">
          {(site.offers || []).slice(0, 3).map((offer, index) => <div key={index}><b>{offer.title}</b><span>{offer.text}</span></div>)}
        </div>
        <a className="realEstatePromotionButton" href="#contact">Request Information</a>
      </div>
    );
  }
  if (page === 'Projects') {
    const copy = sectionText(site, 'Projects').trim();
    const firstLine = copy.split('\n').find(Boolean) || (residential ? 'Homes for every chapter' : 'Properties positioned for opportunity');
    return (
      <div className={`realEstateProjectsPromotion ${residential ? 'residentialRealEstateProjects' : 'commercialRealEstateProjects'}`}>
        <div><small>{residential ? 'Featured homes' : 'Featured properties'}</small><strong>{firstLine.slice(0, 78)}</strong><span>Edit this section with listings, recent projects, property types, locations, or investment highlights.</span></div>
        <a className="realEstatePromotionButton" href="#contact">Discuss Your Goals</a>
      </div>
    );
  }
  return null;
}

function WellnessTemplatePromotion({ site, page }) {
  if (site.typeKey !== 'wellness') return null;
  const hasReplacement = Array.isArray(site.media) && site.media.some(item => item?.section === page && item?.url);
  if (hasReplacement) return null;
  const clean = site.styleKey === 'clean-minimal';
  if (page === 'Products') return (
    <div className={`wellnessProductsPromotion ${clean ? 'cleanWellnessProducts' : 'botanicalWellnessProducts'}`}>
      <header><small>{clean ? 'Simple wellness support' : 'Botanical collection'}</small><strong>{site.offerTitle || 'Wellness Benefits'}</strong></header>
      <div className="wellnessPromotionItems">{(site.offers || []).slice(0,3).map((offer,index)=><div key={index}><b>{offer.title}</b><span>{offer.text}</span></div>)}</div>
      <a className="wellnessPromotionButton" href="#contact">Learn More</a>
    </div>
  );
  if (page === 'About') {
    const copy = sectionText(site, 'About').trim() || (clean ? 'A calmer approach to everyday wellness' : 'Rooted in thoughtful botanical traditions');
    return <div className={`wellnessStoryPromotion ${clean ? 'cleanWellnessStory' : 'botanicalWellnessStory'}`}><div><small>{clean ? 'Our approach' : 'Our botanical story'}</small><strong>{copy.split('\n')[0].slice(0,78)}</strong><span>Edit this section with your story, ingredients, practices, qualifications, and customer guidance.</span></div><a className="wellnessPromotionButton" href="#contact">Connect With Us</a></div>;
  }
  return null;
}

function LocalTemplatePromotion({ site, page }) {
  if (site.typeKey !== 'local') return null;
  const studio = site.styleKey === 'service-realistic';
  if (page === 'Services') return <div className={`localServicesPromotion ${studio?'studioLocalServices':'repairLocalServices'}`}><header><small>{studio?'Friendly local service':'Dependable home service'}</small><strong>{site.offerTitle||'Services & Offers'}</strong></header><div className="localPromotionItems">{(site.offers||[]).slice(0,3).map((o,i)=><div key={i}><b>{o.title}</b><span>{o.text}</span></div>)}</div><a className="localPromotionButton" href="#contact">Request Service</a></div>;
  if (page === 'About') { const copy=(sectionText(site,'About').trim()||'Local service you can count on').split('\n')[0]; return <div className={`localStoryPromotion ${studio?'studioLocalStory':'repairLocalStory'}`}><div><small>{studio?'Your neighborhood business':'Why choose us'}</small><strong>{copy.slice(0,78)}</strong><span>Edit this section with your experience, service area, process, guarantees, and customer promise.</span></div><a className="localPromotionButton" href="#contact">Contact Us</a></div>; }
  return null;
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
    `shape-${site.sectionShape || 'cards'}`,
    site.heroImage ? 'has-hero-upload' : 'uses-template-hero'
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
            <FoodTemplatePromotion site={site} page={page} />
            <BeautyTemplatePromotion site={site} page={page} />
            <RealEstateTemplatePromotion site={site} page={page} />
            <WellnessTemplatePromotion site={site} page={page} />
            <LocalTemplatePromotion site={site} page={page} />
            {['Gallery','Portfolio','Projects','Before & After','Products','Menu','Services'].includes(page) && pageMedia.length > 0 && (
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
