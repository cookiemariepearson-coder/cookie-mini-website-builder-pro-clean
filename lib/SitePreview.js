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

function MediaGrid({ site, page }) {
  const media = Array.isArray(site.media) ? site.media.filter(m => !m.section || m.section === page) : [];
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

function OfferStrip({ site, tags }) {
  const offers = Array.isArray(site.offers) ? site.offers.filter(o => o && (o.title || o.text)).slice(0, 3) : [];
  const list = offers.length ? offers : tags.map(t => ({ title: t, text: 'Add a short highlight that helps visitors understand the offer.' }));
  return (
    <div className="siteOfferStrip">
      {list.map((offer, i) => <div className="siteOfferCard" key={i}><strong>{offer.title}</strong><p>{offer.text}</p></div>)}
    </div>
  );
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
  const hasAction = nonHome.some(p => p === 'Order / Book / Buy' || p === 'Customer Action');

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
          {!hasAction && <div className="siteFallbackActions">{site.phone && <a className="siteActionBtn secondary" href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`}>Call Now</a>}{site.customerEmail && <a className="siteActionBtn secondary" href={`mailto:${site.customerEmail}`}>Email Us</a>}</div>}
        </div>
        <div className="siteHeroVisual">
          {site.heroImage ? <img src={site.heroImage} alt={`${businessName} visual`} /> : (
            <div className="siteHeroArt">
              <span className="styleBadge">{profile.mark} {profile.badge}</span>
              <span className="bigIcon">{icon}</span>
              <strong>{businessName}</strong>
              <small>{label}</small>
              <div>{tags.map(t => <em key={t}>{t}</em>)}</div>
            </div>
          )}
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
