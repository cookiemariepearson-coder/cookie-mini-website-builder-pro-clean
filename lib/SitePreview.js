import { visiblePagesForPlan, normalizeCustomerActions, plans } from './siteDefaults';

const looks = {
  food: ['🍽️','Flavor Studio',['Menu','Order','Specials']],
  beauty: ['💄','Beauty Lounge',['Book','Services','Gallery']],
  realestate: ['🏡','Property Hub',['Invest','Tour','Contact']],
  wellness: ['🌿','Wellness Space',['Programs','Support','Book']],
  local: ['🛠️','Service Pro',['Quote','Book','Call']],
  digital: ['💻','Digital Launch',['Buy','Access','Benefits']],
  nonprofit: ['🤝','Community Mission',['Programs','Support','Contact']],
  creator: ['🎬','Creator Studio',['Portfolio','Book','Projects']],
  cleaning: ['✨','Clean Service',['Quote','Before/After','Book']],
  coaching: ['📘','Consulting Desk',['Strategy','Book','Programs']],
  party: ['🎈','Event Party',['Packages','Book','Gallery']],
  shop: ['🛍️','Boutique Shop',['Products','Buy','Order']]
};

function text(value = '') { return String(value || '').trim(); }
function lines(value = '') { return text(value).split('\n').map(v => v.trim()).filter(Boolean); }
function slug(page = '') { return text(page).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section'; }

function styleProfile(styleKey = '') {
  const key = String(styleKey || '').toLowerCase();
  if (key.includes('cartoon') || key.includes('color-pop') || key.includes('bright')) return { tone: 'pop', badge: 'Playful Look', mark: '✦' };
  if (key.includes('luxury') || key.includes('glam') || key.includes('advisor') || key.includes('product')) return { tone: 'luxury', badge: 'Luxury Look', mark: '◆' };
  if (key.includes('realistic') || key.includes('building') || key.includes('storefront')) return { tone: 'realistic', badge: 'Realistic Look', mark: '▣' };
  if (key.includes('clean') || key.includes('minimal') || key.includes('expert')) return { tone: 'clean', badge: 'Clean Look', mark: '○' };
  if (key.includes('3d') || key.includes('creator-tool')) return { tone: '3d', badge: '3D Look', mark: '◈' };
  if (key.includes('cinematic')) return { tone: 'cinematic', badge: 'Cinematic Look', mark: '◐' };
  return { tone: 'bold', badge: 'Bold Look', mark: '●' };
}

function hrefFor(action = {}) {
  const raw = text(action.value);
  const type = text(action.type || 'custom').toLowerCase();
  if (!raw) return '';
  if (type === 'call') return `tel:${raw.replace(/[^0-9+]/g, '')}`;
  if (type === 'text') return `sms:${raw.replace(/[^0-9+]/g, '')}`;
  if (type === 'email') return `mailto:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes('@')) return `mailto:${raw}`;
  if (/^[+()\-\s0-9]{7,}$/.test(raw)) return `tel:${raw.replace(/[^0-9+]/g, '')}`;
  return `https://${raw}`;
}

function sectionTitle(page = '') {
  return ({
    Home: 'Welcome',
    About: 'About Us',
    Services: 'Services',
    Menu: 'Menu & Specials',
    Products: 'Products & Offers',
    Gallery: 'Gallery',
    Portfolio: 'Portfolio',
    Projects: 'Featured Projects',
    'Before & After': 'Before & After',
    Testimonials: 'Customer Love',
    FAQ: 'Questions & Answers',
    'Order / Book / Buy': 'Ready to get started?',
    Contact: 'Contact Us'
  })[page] || page;
}

function fallback(page, label) {
  return ({
    About: `Share the story behind ${label}, what makes it trustworthy, and why customers should choose it.`,
    Services: 'List the services, packages, prices, service area, and how customers can book.',
    Menu: 'Add menu items, specials, prices, pickup details, delivery options, and ordering instructions.',
    Products: 'Show products, bundles, benefits, prices, and how customers can buy.',
    Gallery: 'Show captions for photos, videos, transformations, product shots, or behind-the-scenes details.',
    Portfolio: 'Show creative work, case studies, projects, videos, or past results.',
    Projects: 'Highlight recent work, client projects, community projects, or featured results.',
    'Before & After': 'Show transformations, makeovers, cleanups, results, and proof that builds trust.',
    Testimonials: 'Add reviews, shoutouts, and customer proof.',
    FAQ: 'Answer the questions customers ask before buying, booking, or contacting you.',
    'Order / Book / Buy': 'Choose an option below to order, book, buy, request a quote, view a menu, or contact us.',
    Contact: 'Share phone, email, location, hours, service area, and best way to reach you.'
  })[page] || 'Add your wording here.';
}

function ActionButtons({ site, compact = false }) {
  const actions = normalizeCustomerActions(site.customerActions, site.plan).filter(a => a.label || a.value);
  if (!actions.length) return null;
  return (
    <div className={compact ? 'siteActionRow compact' : 'siteActionRow'}>
      {actions.map((action, i) => {
        const href = hrefFor(action);
        const external = href && !href.startsWith('tel:') && !href.startsWith('sms:') && !href.startsWith('mailto:');
        return (
          <div className="siteActionUnit" key={`${action.label}-${i}`}>
            {href ? <a className="siteActionBtn" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{action.label || 'Contact Us'}{external ? ' ↗' : ''}</a> : <span className="siteActionBtn disabled">{action.label || 'Contact Us'}</span>}
            {action.note && <small>{action.note}</small>}
          </div>
        );
      })}
    </div>
  );
}

function ContactButtons({ site }) {
  const actions = normalizeCustomerActions(site.customerActions, site.plan);
  const hasCall = actions.some(action => action.type === 'call' && text(action.value));
  const hasEmail = actions.some(action => action.type === 'email' && text(action.value));
  if ((!site.phone || hasCall) && (!site.customerEmail || hasEmail)) return null;
  return (
    <div className="siteFallbackActions">
      {site.phone && !hasCall && <a className="siteActionBtn secondary" href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`}>Call Now</a>}
      {site.customerEmail && !hasEmail && <a className="siteActionBtn secondary" href={`mailto:${site.customerEmail}`}>Email Us</a>}
    </div>
  );
}

function MediaGrid({ site, page }) {
  const media = Array.isArray(site.media) ? site.media.filter(m => (!m.section || m.section === page) && text(m.url)) : [];
  if (!media.length) return null;
  return (
    <div className="siteMediaGrid">
      {media.slice(0,6).map((item, i) => {
        if (item.kind === 'image' && item.url) {
          return <figure className="siteMediaCard" key={i}><img src={item.url} alt={item.title || page} /><figcaption>{item.title || `${page} image`}</figcaption></figure>;
        }
        const href = hrefFor({ value: item.url, type: 'custom' });
        return <a className="siteMediaCard siteMediaLink" href={href || '#'} target={href ? '_blank' : undefined} rel={href ? 'noreferrer' : undefined} key={i}>{item.title || 'Media link'} ↗</a>;
      })}
    </div>
  );
}

const signatureVisuals = {
  'kitchen-realistic': { hero: '/templates/food/soul-food-hero-v1.webp', feature: 'Menu', featureImage: '/templates/food/menu-promo-v1.webp', story: 'Gallery', storyImage: '/templates/food/event-promo-v1.webp' },
  'cartoon-food': { hero: '/templates/food/coastal-hero-v2.webp', feature: 'Menu', featureImage: '/templates/food/coastal-menu-v2.webp', story: 'Gallery', storyImage: '/templates/food/coastal-event-v2.webp' },
  'floral-glam': { hero: '/templates/beauty/salon-hero-v1.webp', feature: 'Services', featureImage: '/templates/beauty/services-promo-v1.webp', story: 'Gallery', storyImage: '/templates/beauty/gallery-promo-v1.webp' },
  'luxury-salon': { hero: '/templates/beauty/luxury-hero-v3.webp', feature: 'Services', featureImage: '/templates/beauty/luxury-services-v2.webp', story: 'Gallery', storyImage: '/templates/beauty/luxury-gallery-v2.webp' },
  'building-pro': { hero: '/templates/realestate/commercial-hero-v1.webp', feature: 'Services', featureImage: '/templates/realestate/commercial-services-v1.webp', story: 'Projects', storyImage: '/templates/realestate/commercial-projects-v1.webp' },
  'modern-property': { hero: '/templates/realestate/residential-hero-v1.webp', feature: 'Services', featureImage: '/templates/realestate/residential-services-v1.webp', story: 'Projects', storyImage: '/templates/realestate/residential-projects-v1.webp' },
  'flowers-herbs': { hero: '/templates/wellness/botanical-hero-v1.webp', feature: 'Products', featureImage: '/templates/wellness/botanical-products-v1.webp', story: 'About', storyImage: '/templates/wellness/botanical-story-v1.webp' },
  'clean-minimal': { hero: '/templates/wellness/clean-hero-v1.webp', feature: 'Products', featureImage: '/templates/wellness/clean-products-v1.webp', story: 'About', storyImage: '/templates/wellness/clean-story-v1.webp' },
  'service-3d': { hero: '/templates/local/repair-hero-v1.webp', feature: 'Services', featureImage: '/templates/local/repair-services-v1.webp', story: 'About', storyImage: '/templates/local/repair-story-v1.webp' },
  'service-realistic': { hero: '/templates/local/studio-hero-v1.webp', feature: 'Services', featureImage: '/templates/local/studio-services-v1.webp', story: 'About', storyImage: '/templates/local/studio-story-v1.webp' },
  'bold-sales': { hero: '/templates/digital/bold-hero-v1.webp', feature: 'Products', featureImage: '/templates/digital/bold-products-v1.webp', story: 'Testimonials', storyImage: '/templates/digital/bold-story-v1.webp' },
  'creator-tool': { hero: '/templates/digital/creator-hero-v1.webp', feature: 'Products', featureImage: '/templates/digital/creator-products-v1.webp', story: 'Testimonials', storyImage: '/templates/digital/creator-story-v1.webp' },
  'warm-mission': { hero: '/templates/nonprofit/warm-hero-v1.webp', feature: 'Projects', featureImage: '/templates/nonprofit/warm-programs-v1.webp', story: 'Gallery', storyImage: '/templates/nonprofit/warm-story-v1.webp' },
  'bold-action': { hero: '/templates/nonprofit/action-hero-v1.webp', feature: 'Projects', featureImage: '/templates/nonprofit/action-programs-v1.webp', story: 'Gallery', storyImage: '/templates/nonprofit/action-story-v1.webp' },
  cinematic: { hero: '/templates/creator/cinematic-hero-v1.webp', feature: 'Portfolio', featureImage: '/templates/creator/cinematic-work-v1.webp', story: 'Gallery', storyImage: '/templates/creator/cinematic-gallery-v1.webp' },
  'cartoon-creative': { hero: '/templates/creator/playful-hero-v1.webp', feature: 'Portfolio', featureImage: '/templates/creator/playful-work-v1.webp', story: 'Gallery', storyImage: '/templates/creator/playful-gallery-v1.webp' },
  'clean-realistic': { hero: '/templates/cleaning/premium-hero-v1.webp', feature: 'Services', featureImage: '/templates/cleaning/premium-services-v1.webp', story: 'Before & After', storyImage: '/templates/cleaning/premium-results-v1.webp' },
  'cartoon-sparkle': { hero: '/templates/cleaning/friendly-hero-v1.webp', feature: 'Services', featureImage: '/templates/cleaning/friendly-services-v1.webp', story: 'Before & After', storyImage: '/templates/cleaning/friendly-results-v1.webp' },
  'expert-clean': { hero: '/templates/coaching/expert-hero-v1.webp', feature: 'Services', featureImage: '/templates/coaching/expert-services-v1.webp', story: 'Testimonials', storyImage: '/templates/coaching/expert-story-v1.webp' },
  'luxury-advisor': { hero: '/templates/coaching/luxury-hero-v1.webp', feature: 'Services', featureImage: '/templates/coaching/luxury-services-v1.webp', story: 'Testimonials', storyImage: '/templates/coaching/luxury-story-v1.webp' },
  'cartoon-bright': { hero: '/templates/party/bright-hero-v1.webp', feature: 'Services', featureImage: '/templates/party/bright-services-v1.webp', story: 'Gallery', storyImage: '/templates/party/bright-gallery-v1.webp' },
  'color-pop': { hero: '/templates/party/block-hero-v1.webp', feature: 'Services', featureImage: '/templates/party/block-services-v1.webp', story: 'Gallery', storyImage: '/templates/party/block-gallery-v1.webp' },
  'luxury-product': { hero: '/templates/shop/luxury-hero-v1.webp', feature: 'Products', featureImage: '/templates/shop/luxury-products-v1.webp', story: 'Gallery', storyImage: '/templates/shop/luxury-gallery-v1.webp' },
  'storefront-realistic': { hero: '/templates/shop/storefront-hero-v1.webp', feature: 'Products', featureImage: '/templates/shop/storefront-products-v1.webp', story: 'Gallery', storyImage: '/templates/shop/storefront-gallery-v1.webp' }
};

function OfferStrip({ site, tags }) {
  const offers = Array.isArray(site.offers) ? site.offers.filter(o => o && (o.title || o.text)).slice(0, 3) : [];
  const list = offers.length ? offers : tags.map(t => ({ title: t, text: 'Add a short highlight that helps visitors understand the offer.' }));
  return (
    <div className="siteOfferStrip">
      {list.map((offer, i) => <div className="siteOfferCard" key={i}><strong>{offer.title}</strong><p>{offer.text}</p></div>)}
    </div>
  );
}

function TemplateHeroVisual({ site, icon, label, tags, profile, businessName }) {
  if (site.heroImage) return <img src={site.heroImage} alt={`${businessName} visual`} />;

  const signature = signatureVisuals[site.styleKey];
  if (signature?.hero) return <img className="signatureHeroImage" src={signature.hero} alt={`${businessName} ${label} template visual`} />;

  const scenes = {
    food: <div className="templateScene foodScene"><div className="foodSceneLabel"><span>Fresh from the kitchen</span><small>Made to order • Pickup • Catering</small></div></div>,
    beauty: <div className="templateScene beautyScene"><span className="beautyBloom">✿</span><div className="beautyPortrait">💇🏾‍♀️</div><strong>Look good. Feel confident.</strong><small>Styling • Care • Appointments</small></div>,
    realestate: <div className="templateScene propertyScene"><div className="skyline"><span>▥</span><b>🏡</b><i>▤</i></div><strong>Properties with potential</strong><small>Homes • Land • Investments</small></div>,
    digital: <div className="templateScene digitalScene"><div className="deviceMockup"><span>CREATOR KIT</span><b>Instant Download</b><i>✓ Ready to use</i></div><strong>Build. Launch. Grow.</strong><small>Templates • Guides • Digital tools</small></div>,
    shop: <div className="templateScene shopScene"><div className="productShelf"><span>👜</span><b>👠</b><i>🕶️</i></div><strong>Curated boutique finds</strong><small>New arrivals • Best sellers • Secure checkout</small></div>
  };

  if (scenes[site.typeKey]) return scenes[site.typeKey];
  return (
    <div className="siteHeroArt">
      <span className="styleBadge">{profile.mark} {profile.badge}</span>
      <span className="bigIcon">{icon}</span>
      <strong>{businessName}</strong>
      <small>{label}</small>
      <div>{tags.map(t => <em key={t}>{t}</em>)}</div>
    </div>
  );
}

function TemplateFeatureArtwork({ site, page }) {
  const hasUploadedMedia = Array.isArray(site.media) && site.media.some(item => item?.section === page && item?.url);
  if (hasUploadedMedia) return null;

  const signature = signatureVisuals[site.styleKey];
  if (signature && (page === signature.feature || page === signature.story)) {
    const isFeature = page === signature.feature;
    const image = isFeature ? signature.featureImage : signature.storyImage;
    const offers = Array.isArray(site.offers) ? site.offers.slice(0, 3) : [];
    return (
      <div className={`signatureSiteArtwork ${isFeature ? 'signatureFeatureArtwork' : 'signatureStoryArtwork'}`} style={{ backgroundImage: `linear-gradient(180deg,rgba(12,7,19,.08),rgba(12,7,19,.82)),url(${image})` }}>
        <div className="signatureSiteArtworkCopy">
          <small>{isFeature ? sectionTitle(page) : 'Your Story & Results'}</small>
          <strong>{isFeature ? (site.offerTitle || sectionTitle(page)) : (lines(site.sections?.[page])[0] || sectionTitle(page))}</strong>
          {isFeature && <div className="signatureSiteOfferList">{offers.map((offer, index) => <span key={index}><b>{offer.title}</b>{offer.text}</span>)}</div>}
          <ActionButtons site={site} compact />
        </div>
      </div>
    );
  }

  if (site.typeKey !== 'food') return null;

  if (page === 'Menu') {
    const offers = Array.isArray(site.offers) ? site.offers.slice(0, 3) : [];
    return (
      <div className="foodMenuPromo" aria-label="Editable restaurant menu promotion">
        <div className="foodMenuPromoTitle"><small>Featured menu</small><strong>{site.offerTitle || 'Menu & Specials'}</strong></div>
        <div className="foodMenuPromoItems">
          {offers.map((offer, index) => <div key={index}><b>{offer.title}</b><span>{offer.text}</span></div>)}
        </div>
        <ActionButtons site={site} compact />
      </div>
    );
  }

  if (page === 'Gallery') {
    return (
      <div className="foodEventPromo" aria-label="Editable restaurant event promotion">
        <div className="foodEventPromoCopy">
          <small>Food • Music • Community</small>
          <strong>{site.sections?.Gallery?.split?.('\n')?.[0] || 'Plan your next food event'}</strong>
          <span>Add event photos, specials, dates, and location details in the Gallery section.</span>
        </div>
        <ActionButtons site={site} compact />
      </div>
    );
  }
  return null;
}

function Section({ site, page, index, label }) {
  if (page === 'Order / Book / Buy' || page === 'Customer Action') {
    const copy = lines(site.sections?.['Order / Book / Buy'] || site.sections?.['Customer Action'] || fallback('Order / Book / Buy', label));
    return (
      <section className="siteSection siteActionSection" id="order-book-buy">
        <div className="siteSectionNumber">GO</div>
        <div>
          <span className="siteKicker">Order • Book • Buy</span>
          <h2>Ready to get started?</h2>
          {copy.map((line, i) => <p key={i}>{line}</p>)}
          <ActionButtons site={site} />
        </div>
      </section>
    );
  }

  const copy = lines(site.sections?.[page] || fallback(page, label));
  const showMedia = ['Services','Menu','Products','Gallery','Portfolio','Projects','Before & After'].includes(page);
  return (
    <section className={`siteSection section-${slug(page)}`} id={slug(page)}>
      <div className="siteSectionNumber">{String(index + 1).padStart(2, '0')}</div>
      <div>
        <span className="siteKicker">{page}</span>
        <h2>{sectionTitle(page)}</h2>
        {copy.map((line, i) => <p key={i}>{line}</p>)}
        <TemplateFeatureArtwork site={site} page={page} />
        {showMedia && <MediaGrid site={site} page={page} />}
      </div>
    </section>
  );
}

export default function SitePreview({ site = {}, draftMode = false }) {
  const pages = visiblePagesForPlan(site);
  const plan = plans[site.plan] || plans.free;
  const [icon, label, tags] = looks[site.typeKey] || looks.local;
  const profile = styleProfile(site.styleKey);
  const businessName = site.businessName || 'Your Business';
  const nonHome = pages.filter(p => p !== 'Home');

  return (
    <article
      className={[
        'cookieCustomerSite',
        `type-${site.typeKey || 'local'}`,
        `look-${site.styleKey || 'default'}`,
        `tone-${profile.tone}`,
        `layout-${site.layoutStyle || 'split'}`,
        `font-${site.fontStyle || 'bold'}`,
        `bg-${site.backgroundStyle || 'gradient'}`,
        `shape-${site.sectionShape || 'cards'}`,
        draftMode ? 'draftMode' : ''
      ].join(' ')}
      style={{
        '--site-primary': site.primaryColor || '#2a103b',
        '--site-accent': site.accentColor || '#ffbd49'
      }}
    >
      <header className="siteTopbar">
        <a href="#home" className="siteBrand"><span>{icon}</span><strong>{businessName}</strong></a>
        <nav>
          <a href="#home">Home</a>
          {nonHome.slice(0, 6).map(p => <a href={`#${p === 'Order / Book / Buy' || p === 'Customer Action' ? 'order-book-buy' : slug(p)}`} key={p}>{p === 'Order / Book / Buy' || p === 'Customer Action' ? 'Order' : p}</a>)}
        </nav>
      </header>

      <section className="siteHero" id="home">
        <div className="siteHeroCopy">
          <span className="siteKicker">{label} • {plan.label}</span>
          <h1>{site.headline || 'A beautiful website created in minutes.'}</h1>
          <p>{site.description || 'A clean business website with clear information and customer action buttons.'}</p>
          <ActionButtons site={site} compact />
          <ContactButtons site={site} />
        </div>
        <div className="siteHeroVisual">
          <TemplateHeroVisual site={site} icon={icon} label={label} tags={tags} profile={profile} businessName={businessName} />
        </div>
      </section>

      <OfferStrip site={site} tags={tags} />

      {nonHome.map((page, index) => <Section site={site} page={page} index={index} label={label} key={page} />)}

      <footer className="siteFooter">
        <div><strong>{businessName}</strong><span>{label}</span></div>
        <div>{site.phone && <a href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`}>{site.phone}</a>}{site.customerEmail && <a href={`mailto:${site.customerEmail}`}>{site.customerEmail}</a>}{plan.branding && <small>Built with Cookie Mini Website Builder</small>}</div>
      </footer>
    </article>
  );
}
