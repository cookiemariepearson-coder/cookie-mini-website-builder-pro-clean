import { visiblePagesForPlan, normalizeCustomerActions, plans } from './siteDefaults';

const templateLooks = {
  food: {
    label: 'Food & Flavor',
    icon: '🍽️',
    tags: ['Menu', 'Orders', 'Fresh Plates'],
    intro: 'Fresh flavor, easy ordering, and clear menu details.'
  },
  beauty: {
    label: 'Beauty & Booking',
    icon: '💄',
    tags: ['Appointments', 'Services', 'Glow'],
    intro: 'A polished beauty layout with booking-focused calls to action.'
  },
  realestate: {
    label: 'Property & Trust',
    icon: '🏡',
    tags: ['Listings', 'Consultation', 'Property Info'],
    intro: 'Professional trust sections for property, investing, and real estate services.'
  },
  wellness: {
    label: 'Wellness & Care',
    icon: '🌿',
    tags: ['Programs', 'Consultation', 'Support'],
    intro: 'Calm sections for wellness services, products, programs, and guidance.'
  },
  local: {
    label: 'Local Service',
    icon: '🛠️',
    tags: ['Quote', 'Booking', 'Service Area'],
    intro: 'Clear service details with simple customer action buttons.'
  },
  digital: {
    label: 'Digital Product',
    icon: '💻',
    tags: ['Buy Now', 'Benefits', 'Access'],
    intro: 'A product-focused layout for digital offers, apps, downloads, and tools.'
  },
  nonprofit: {
    label: 'Mission & Community',
    icon: '🤝',
    tags: ['Programs', 'Support', 'Contact'],
    intro: 'Mission-driven sections for community programs and support.'
  },
  creator: {
    label: 'Creator Portfolio',
    icon: '🎬',
    tags: ['Portfolio', 'Projects', 'Booking'],
    intro: 'A dramatic showcase for creators, film, content, and portfolios.'
  },
  cleaning: {
    label: 'Cleaning Service',
    icon: '✨',
    tags: ['Book Cleaning', 'Before & After', 'Quote'],
    intro: 'Sparkling service sections with booking and quote options.'
  },
  coaching: {
    label: 'Coaching & Consulting',
    icon: '📘',
    tags: ['Book Call', 'Programs', 'Strategy'],
    intro: 'Clean expert sections for coaching, consulting, and client support.'
  },
  party: {
    label: 'Party & Events',
    icon: '🎈',
    tags: ['Book Event', 'Packages', 'Gallery'],
    intro: 'Fun event sections for bookings, packages, and party details.'
  },
  shop: {
    label: 'Shop & Products',
    icon: '🛍️',
    tags: ['Products', 'Buy Now', 'Shop'],
    intro: 'Product-focused sections for boutiques, sellers, and small shops.'
  }
};

function safeText(value = '') {
  return String(value || '').trim();
}

function splitLines(text = '') {
  return safeText(text)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function slugFor(page = '') {
  return safeText(page).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
}

function hrefForAction(action = {}) {
  const raw = safeText(action.value);
  const type = safeText(action.type || 'custom').toLowerCase();

  if (!raw) return '';
  if (type === 'call') return `tel:${raw.replace(/[^0-9+]/g, '')}`;
  if (type === 'text') return `sms:${raw.replace(/[^0-9+]/g, '')}`;
  if (type === 'email') return `mailto:${raw}`;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes('@')) return `mailto:${raw}`;
  if (/^[+()\-\s0-9]{7,}$/.test(raw)) return `tel:${raw.replace(/[^0-9+]/g, '')}`;
  return `https://${raw}`;
}

function titleFor(page = '') {
  const titles = {
    Home: 'Welcome',
    About: 'About Us',
    Services: 'Services',
    Menu: 'Menu & Specials',
    Products: 'Products & Offers',
    Gallery: 'Gallery',
    Portfolio: 'Portfolio',
    Projects: 'Featured Projects',
    'Before & After': 'Before & After',
    Testimonials: 'What Customers Say',
    FAQ: 'Questions & Answers',
    'Order / Book / Buy': 'Ready to get started?',
    Contact: 'Contact Us'
  };
  return titles[page] || page;
}

function defaultTextFor(page = '', look = {}) {
  const text = {
    About: `Tell visitors who you are, what you do, and why they should trust ${look.label || 'your business'}.`,
    Services: 'List your services, packages, prices, service area, and how customers can book.',
    Menu: 'Add menu items, specials, prices, pickup details, delivery information, and ordering instructions.',
    Products: 'Show your products, bundles, benefits, prices, and how customers can buy.',
    Gallery: 'Add photo captions, video descriptions, product shots, transformations, or behind-the-scenes details.',
    Portfolio: 'Show your creative work, case studies, film projects, services, or past results.',
    Projects: 'Highlight your recent work, client projects, community projects, or featured results.',
    'Before & After': 'Show transformations, cleanups, makeovers, results, and proof that builds trust.',
    Testimonials: 'Add customer reviews, shoutouts, and social proof.',
    FAQ: 'Answer common questions customers ask before buying, booking, or contacting you.',
    'Order / Book / Buy': 'Choose an option below to order, book, buy, request a quote, view a menu, or contact us.',
    Contact: 'Share your phone, email, location, hours, service area, and best way to reach you.'
  };
  return text[page] || 'Add your section wording here.';
}

function ExternalIcon() {
  return <span className="templateButtonIcon" aria-hidden="true">↗</span>;
}

function TemplateMedia({ site, page }) {
  const media = Array.isArray(site.media)
    ? site.media.filter(item => !item.section || item.section === page)
    : [];

  if (!media.length) return null;

  return (
    <div className="templateMediaGrid">
      {media.slice(0, 6).map((item, index) => {
        const title = item.title || `${page} media ${index + 1}`;
        if (item.kind === 'image' && item.url) {
          return (
            <figure className="templateMediaCard" key={`${page}-media-${index}`}>
              <img src={item.url} alt={title} />
              <figcaption>{title}</figcaption>
            </figure>
          );
        }

        const href = hrefForAction({ value: item.url, type: 'custom' });
        return (
          <a className="templateMediaCard templateMediaLink" href={href || '#'} target={href ? '_blank' : undefined} rel={href ? 'noreferrer' : undefined} key={`${page}-media-${index}`}>
            <strong>{title}</strong>
            {href && <ExternalIcon />}
          </a>
        );
      })}
    </div>
  );
}

function ActionButtons({ site, compact = false }) {
  const actions = normalizeCustomerActions(site.customerActions, site.plan).filter(action => action.label || action.value);
  if (!actions.length) return null;

  return (
    <div className={compact ? 'templateActionRail compact' : 'templateActionRail'}>
      {actions.map((action, index) => {
        const href = hrefForAction(action);
        const external = href && !href.startsWith('tel:') && !href.startsWith('sms:') && !href.startsWith('mailto:');
        const label = action.label || 'Contact Us';

        return (
          <div className="templateActionItem" key={`${label}-${index}`}>
            {href ? (
              <a className="templateActionButton" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
                {label}
                {external && <ExternalIcon />}
              </a>
            ) : (
              <span className="templateActionButton disabled">{label}</span>
            )}
            {action.note && <small>{action.note}</small>}
          </div>
        );
      })}
    </div>
  );
}

function OrderBookBuySection({ site, look }) {
  const sectionText = site.sections?.['Order / Book / Buy'] || site.sections?.['Customer Action'] || defaultTextFor('Order / Book / Buy', look);
  const lines = splitLines(sectionText);

  return (
    <section className="templateSection templateActionSection" id="order-book-buy">
      <div className="sectionNumber">Action</div>
      <div>
        <span className="templateKicker">Order • Book • Buy</span>
        <h2>Ready to get started?</h2>
        {lines.map((line, index) => <p key={`action-line-${index}`}>{line}</p>)}
        <ActionButtons site={site} />
      </div>
    </section>
  );
}

function GenericSection({ site, page, look, index }) {
  const lines = splitLines(site.sections?.[page] || defaultTextFor(page, look));
  const visualPages = ['Services','Menu','Products','Gallery','Portfolio','Projects','Before & After','Testimonials','FAQ'];
  const shouldShowMedia = ['Gallery','Portfolio','Projects','Products','Menu','Services','Before & After'].includes(page);

  return (
    <section className={`templateSection section-${slugFor(page)} ${visualPages.includes(page) ? 'visualSection' : ''}`} id={slugFor(page)}>
      <div className="sectionNumber">{String(index + 1).padStart(2, '0')}</div>
      <div className="templateSectionContent">
        <span className="templateKicker">{page}</span>
        <h2>{titleFor(page)}</h2>
        <div className="templateTextBlock">
          {lines.map((line, lineIndex) => <p key={`${page}-line-${lineIndex}`}>{line}</p>)}
        </div>
        {shouldShowMedia && <TemplateMedia site={site} page={page} />}
      </div>
    </section>
  );
}

function OfferStrip({ site, look }) {
  const offers = Array.isArray(site.offers) ? site.offers.filter(offer => offer && (offer.title || offer.text)) : [];
  const fallback = look.tags || ['Book', 'Buy', 'Contact'];

  return (
    <div className="templateOfferStrip">
      {(offers.length ? offers.slice(0, 3) : fallback.map(tag => ({ title: tag, text: look.intro }))).map((offer, index) => (
        <div className="templateOfferCard" key={`${offer.title || fallback[index]}-${index}`}>
          <strong>{offer.title || fallback[index]}</strong>
          <p>{offer.text || look.intro}</p>
        </div>
      ))}
    </div>
  );
}

export default function SitePreview({ site = {}, draftMode = false }) {
  const pages = visiblePagesForPlan(site);
  const look = templateLooks[site.typeKey] || templateLooks.local;
  const plan = plans[site.plan] || plans.free;
  const businessName = site.businessName || 'Your Business';
  const headline = site.headline || 'A beautiful website created in minutes.';
  const description = site.description || look.intro || 'Add your business details so customers know what you offer.';
  const primary = site.primaryColor || '#2a103b';
  const accent = site.accentColor || '#ffbd49';
  const nonHomePages = pages.filter(page => page !== 'Home');
  const hasActionPage = nonHomePages.some(page => page === 'Order / Book / Buy' || page === 'Customer Action');

  return (
    <article
      className={[
        'customerTemplatePreview',
        `template-${site.typeKey || 'local'}`,
        `style-${site.styleKey || 'default'}`,
        `layout-${site.layoutStyle || 'split'}`,
        `shape-${site.sectionShape || 'cards'}`,
        draftMode ? 'draftPreview' : ''
      ].join(' ')}
      style={{
        '--template-primary': primary,
        '--template-accent': accent,
        '--brand-purple': '#2a103b',
        '--brand-purple-deep': '#12071d',
        '--brand-gold': '#ffbd49',
        '--brand-orange': '#f28a1e'
      }}
    >
      <header className="templateTopbar">
        <a className="templateBrandMark" href="#home">
          <span>{look.icon}</span>
          <strong>{businessName}</strong>
        </a>
        <nav className="templateNav">
          <a href="#home">Home</a>
          {nonHomePages.slice(0, 6).map(page => (
            <a href={`#${page === 'Customer Action' ? 'order-book-buy' : slugFor(page)}`} key={page}>
              {page === 'Order / Book / Buy' || page === 'Customer Action' ? 'Order' : page}
            </a>
          ))}
        </nav>
      </header>

      <section className="templateHero" id="home">
        <div className="templateHeroCopy">
          <span className="templateKicker">{look.label} • {plan.label}</span>
          <h1>{headline}</h1>
          <p>{description}</p>
          <ActionButtons site={site} compact />
          {!hasActionPage && (
            <div className="templateHeroFallbackActions">
              {site.phone && <a className="templateActionButton secondary" href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`}>Call Now</a>}
              {site.customerEmail && <a className="templateActionButton secondary" href={`mailto:${site.customerEmail}`}>Email Us</a>}
            </div>
          )}
        </div>

        <div className="templateHeroVisual">
          {site.heroImage ? (
            <img src={site.heroImage} alt={`${businessName} hero`} />
          ) : (
            <div className="templateHeroArt">
              <span className="heroIcon">{look.icon}</span>
              <strong>{businessName}</strong>
              <small>{look.intro}</small>
              <div className="heroTagGrid">
                {(look.tags || []).map(tag => <span key={tag}>{tag}</span>)}
              </div>
            </div>
          )}
        </div>
      </section>

      <OfferStrip site={site} look={look} />

      {nonHomePages.map((page, index) => (
        page === 'Order / Book / Buy' || page === 'Customer Action'
          ? <OrderBookBuySection site={site} look={look} key={page} />
          : <GenericSection site={site} page={page} look={look} index={index} key={page} />
      ))}

      <footer className="templateFooter">
        <div>
          <strong>{businessName}</strong>
          <span>{look.label}</span>
        </div>
        <div className="templateFooterLinks">
          {site.phone && <a href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`}>{site.phone}</a>}
          {site.customerEmail && <a href={`mailto:${site.customerEmail}`}>{site.customerEmail}</a>}
          {plan.branding && <small>Built with Cookie Mini Website Builder</small>}
        </div>
      </footer>
    </article>
  );
}
