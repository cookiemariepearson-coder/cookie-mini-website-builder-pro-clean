import { visiblePagesForPlan, normalizeCustomerActions, plans } from './siteDefaults';

function isUrl(value = '') {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function hrefForAction(action = {}) {
  const raw = String(action.value || '').trim();
  const type = String(action.type || 'custom').toLowerCase();

  if (type === 'call') return raw ? `tel:${raw.replace(/[^0-9+]/g, '')}` : '';
  if (type === 'text') return raw ? `sms:${raw.replace(/[^0-9+]/g, '')}` : '';
  if (type === 'email') return raw ? `mailto:${raw}` : '';

  if (!raw) return '';
  if (isUrl(raw)) return raw;
  if (raw.includes('@')) return `mailto:${raw}`;
  if (/^[+()\-\s0-9]{7,}$/.test(raw)) return `tel:${raw.replace(/[^0-9+]/g, '')}`;
  return `https://${raw}`;
}

function splitLines(text = '') {
  return String(text || '').split('\n').map(line => line.trim()).filter(Boolean);
}

function sectionTitle(page) {
  if (page === 'Order / Book / Buy') return 'Ready to get started?';
  return page;
}

function MediaBlock({ site, page }) {
  const media = Array.isArray(site.media) ? site.media.filter(item => !item.section || item.section === page) : [];
  if (!media.length) return null;
  return (
    <div className="previewMediaGrid">
      {media.slice(0, 6).map((item, index) => {
        const title = item.title || `${page} item ${index + 1}`;
        if (item.kind === 'image' && item.url) {
          return <figure className="previewMediaCard" key={index}><img src={item.url} alt={title} /><figcaption>{title}</figcaption></figure>;
        }
        const link = hrefForAction({ value: item.url, type: 'custom' });
        return <a className="previewMediaCard previewMediaLink" key={index} href={link || '#'} target="_blank" rel="noreferrer">{title}</a>;
      })}
    </div>
  );
}

function CustomerActionSection({ site }) {
  const actions = normalizeCustomerActions(site.customerActions, site.plan);
  const visibleActions = actions.filter(action => action.label || action.value);
  const lines = splitLines(site.sections?.['Order / Book / Buy'] || site.sections?.['Customer Action'] || 'Ready to get started? Choose an option below to order, book, buy, request a quote, or contact us.');
  if (!visibleActions.length && !lines.length) return null;

  return (
    <section className="previewSection previewActionSection" id="order-book-buy">
      <span className="previewKicker">Order • Book • Buy</span>
      <h2>Ready to get started?</h2>
      {lines.map((line, i) => <p key={i}>{line}</p>)}
      <div className="previewActionButtons">
        {visibleActions.map((action, index) => {
          const href = hrefForAction(action);
          const note = action.note || '';
          const external = href && !href.startsWith('tel:') && !href.startsWith('sms:') && !href.startsWith('mailto:');
          return (
            <div className="previewActionButtonWrap" key={`${action.label}-${index}`}>
              {href ? (
                <a className="previewActionButton" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{action.label || 'Contact Us'}</a>
              ) : (
                <span className="previewActionButton disabled">{action.label || 'Contact Us'}</span>
              )}
              {note && <small>{note}</small>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GenericSection({ site, page }) {
  const text = site.sections?.[page] || '';
  const lines = splitLines(text);
  const showMedia = ['Gallery','Portfolio','Products','Projects','Before & After','Menu','Services'].includes(page);
  return (
    <section className="previewSection" id={page.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
      <span className="previewKicker">{page}</span>
      <h2>{sectionTitle(page)}</h2>
      {lines.length ? lines.map((line, i) => <p key={i}>{line}</p>) : <p>Add your {page.toLowerCase()} details here.</p>}
      {showMedia && <MediaBlock site={site} page={page} />}
    </section>
  );
}

export default function SitePreview({ site = {}, draftMode = false }) {
  const pages = visiblePagesForPlan(site);
  const palette = {
    primary: site.primaryColor || '#20172f',
    accent: site.accentColor || '#e98024'
  };
  const plan = plans[site.plan] || plans.free;
  const businessName = site.businessName || 'Your Business';
  const navPages = pages.filter(page => page !== 'Home').slice(0, 5);

  return (
    <article
      className={`cookieSitePreview ${draftMode ? 'draftPreview' : ''} layout-${site.layoutStyle || 'split'} bg-${site.backgroundStyle || 'gradient'} shape-${site.sectionShape || 'cards'}`}
      style={{
        '--preview-primary': palette.primary,
        '--preview-accent': palette.accent
      }}
    >
      <header className="previewHeader">
        <strong>{businessName}</strong>
        <nav>
          <a href="#home">Home</a>
          {navPages.map(page => <a key={page} href={`#${page.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{page === 'Order / Book / Buy' ? 'Order' : page}</a>)}
        </nav>
      </header>

      <section className="previewHero" id="home">
        <div>
          <span className="previewKicker">{plan.label}</span>
          <h1>{site.headline || 'A beautiful website created in minutes.'}</h1>
          <p>{site.description || 'Add your business details, services, products, and contact information so customers know what you offer.'}</p>
          <div className="previewHeroActions">
            <a href="#order-book-buy" className="previewActionButton">Get Started</a>
            {site.phone && <a href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`} className="previewActionButton secondary">Call Now</a>}
          </div>
        </div>
        <div className="previewHeroVisual">
          {site.heroImage ? <img src={site.heroImage} alt={`${businessName} visual`} /> : <div className="previewPlaceholder"><span>✨</span><strong>{businessName}</strong><small>Build. Launch. Grow.</small></div>}
        </div>
      </section>

      {pages.filter(page => page !== 'Home').map(page => (
        page === 'Order / Book / Buy' || page === 'Customer Action'
          ? <CustomerActionSection site={site} key={page} />
          : <GenericSection site={site} page={page} key={page} />
      ))}

      {site.offers?.length ? (
        <section className="previewOfferGrid">
          {site.offers.slice(0, 3).map((offer, i) => (
            <div key={i} className="previewOfferCard">
              <strong>{offer.title}</strong>
              <p>{offer.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      <footer className="previewFooter">
        <strong>{businessName}</strong>
        {site.customerEmail && <a href={`mailto:${site.customerEmail}`}>{site.customerEmail}</a>}
        {site.phone && <a href={`tel:${String(site.phone).replace(/[^0-9+]/g, '')}`}>{site.phone}</a>}
        {plan.branding && <small>Built with Cookie Mini Website Builder</small>}
      </footer>
    </article>
  );
}
