export const plans = {
  free: { label: 'Free Launch Page', price: 'Free', maxPages: 3, maxSections: 3, sectionLabel: '3 selected sections', branding: true, mediaUploads: false, aiVideo: false },
  starter: { label: 'Starter Pro', price: '$19/mo', maxPages: 4, maxSections: 4, sectionLabel: '4 selected sections', branding: false, mediaUploads: true, aiVideo: false },
  business: { label: 'Business', price: '$30/mo', maxPages: 6, maxSections: 6, sectionLabel: '6 selected sections', branding: false, mediaUploads: true, aiVideo: true, aiVideoLimit: 1 },
  premium: { label: 'Premium', price: '$50/mo', maxPages: 99, maxSections: 99, sectionLabel: 'all built-in sections', branding: false, mediaUploads: true, aiVideo: true, aiVideoLimit: 3 }
};

export const pageOptions = ['Home','About','Services','Menu','Products','Gallery','Portfolio','Projects','Before & After','Testimonials','FAQ','Order / Book / Buy','Contact'];

export const sectionPrompts = {
  Home: 'Short welcome message or important intro for the homepage.',
  About: 'Tell your story, mission, background, or why customers should trust you.',
  Services: 'List services, packages, prices, service area, or what customers can book.',
  Menu: 'Add menu items, specials, prices, pickup/delivery information, or food categories.',
  Products: 'Show products, digital items, bundles, benefits, prices, or how customers buy.',
  Gallery: 'Add image/video descriptions, photo gallery wording, or showcase details.',
  Portfolio: 'Show projects, film work, creative services, case studies, or past results.',
  Projects: 'Highlight recent work, case studies, featured projects, or community work.',
  'Before & After': 'Explain transformations, before/after examples, results, or proof.',
  Testimonials: 'Customer reviews, social proof, shoutouts, or trust-building comments.',
  FAQ: 'Common questions and answers customers may need before buying or booking.',
  'Order / Book / Buy': 'Add buttons for ordering, booking, buying, quotes, calls, texts, emails, menus, payments, or custom links.',
  Contact: 'How customers should contact, order, book, visit, or ask questions.'
};

export const templateLibrary = [
  {
    type: 'Food / Restaurant', key: 'food', styles: [
      { key: 'kitchen-realistic', name: 'Realistic Kitchen', art: '🍳', mood: 'warm kitchen art, plated food, chef energy', visual: 'Realistic food photography, steam, recipe-card blocks, warm table textures', palette: { primary: '#30130c', accent: '#d46a23' } },
      { key: 'cartoon-food', name: 'Cartoon Food Fun', art: '🍔', mood: 'bright cartoon food, playful menu cards', visual: 'Cartoon plates, bold menu labels, fun illustrated food shapes', palette: { primary: '#3b1142', accent: '#ff7a24' } }
    ], pages: ['Home','Menu','Gallery','Testimonials','Contact'], title: 'Menu & Specials', offers: ['Fresh Specials','Signature Plates','Order Info']
  },
  {
    type: 'Beauty / Hair / Salon', key: 'beauty', styles: [
      { key: 'floral-glam', name: 'Soft Floral Glam', art: '🌸', mood: 'flowers, soft luxury, beauty accents', visual: 'Soft floral art, beauty-card layout, elegant pink and gold glow', palette: { primary: '#351832', accent: '#d86aa7' } },
      { key: 'luxury-salon', name: 'Luxury Salon', art: '💄', mood: 'glam salon shine, premium service cards', visual: 'Glossy salon panels, glam highlight cards, premium appointment feel', palette: { primary: '#211326', accent: '#c99544' } }
    ], pages: ['Home','Services','Gallery','Testimonials','Contact'], title: 'Beauty Services', offers: ['Styling Services','Price Highlights','Booking Details']
  },
  {
    type: 'Real Estate / Investor', key: 'realestate', styles: [
      { key: 'building-pro', name: 'Realistic Buildings', art: '🏢', mood: 'city buildings, property investor look', visual: 'Realistic buildings, skyline panels, professional investor grid', palette: { primary: '#14233a', accent: '#b17a2f' } },
      { key: 'modern-property', name: '3D Modern Property', art: '🏘️', mood: '3D property cards, clean investor layout', visual: '3D houses, property cards, clean trust-focused investment layout', palette: { primary: '#16243d', accent: '#3f89c9' } }
    ], pages: ['Home','About','Services','Projects','FAQ','Contact'], title: 'Investor Services', offers: ['Property Strategy','Investor Resources','Contact Details']
  },
  {
    type: 'Wellness / Health Product', key: 'wellness', styles: [
      { key: 'flowers-herbs', name: 'Flowers & Herbs', art: '🌿', mood: 'herbs, flowers, calm wellness art', visual: 'Herbal leaves, flowers, calm natural product panels', palette: { primary: '#173829', accent: '#6fa44f' } },
      { key: 'clean-minimal', name: 'Clean Minimal', art: '🧘', mood: 'clean calm product showcase', visual: 'Clean white space, soft wellness glow, simple benefit cards', palette: { primary: '#1d3b35', accent: '#a9c95f' } }
    ], pages: ['Home','Products','About','Testimonials','FAQ','Contact'], title: 'Wellness Benefits', offers: ['Natural Benefits','Product Details','Customer Support']
  },
  {
    type: 'Local Services', key: 'local', styles: [
      { key: 'service-3d', name: '3D Modern', art: '🛠️', mood: '3D service desk, booking cards', visual: '3D service icons, booking cards, trust badges', palette: { primary: '#20172f', accent: '#c46a2d' } },
      { key: 'service-realistic', name: 'Realistic Professional', art: '🏪', mood: 'local storefront and trust badges', visual: 'Realistic storefront, local service panels, map and reviews feel', palette: { primary: '#1b2636', accent: '#2d90a6' } }
    ], pages: ['Home','Services','About','FAQ','Contact'], title: 'Services & Offers', offers: ['Main Service','Service Highlights','Contact Section']
  },
  {
    type: 'Digital Product Seller', key: 'digital', styles: [
      { key: 'bold-sales', name: 'Bold Sales Page', art: '💻', mood: 'digital product cards, bold sales layout', visual: 'Bold product cards, checkout prompts, modern sales sections', palette: { primary: '#15133b', accent: '#7b3ff2' } },
      { key: 'creator-tool', name: '3D Creator Tool', art: '⚙️', mood: 'creator dashboard and 3D app graphics', visual: '3D app panels, dashboard blocks, digital product mockups', palette: { primary: '#150e28', accent: '#f0a21f' } }
    ], pages: ['Home','Products','FAQ','Testimonials','Contact'], title: 'Product Benefits', offers: ['What It Does','Who It Helps','Buy / Access']
  },
  {
    type: 'Nonprofit / Community', key: 'nonprofit', styles: [
      { key: 'warm-mission', name: 'Warm Mission', art: '🤝', mood: 'community warmth and support', visual: 'Warm community images, mission cards, donation/support feel', palette: { primary: '#24315a', accent: '#c66b2d' } },
      { key: 'bold-action', name: 'Bold Action', art: '📣', mood: 'donate/support call-to-action', visual: 'Bold action banners, impact blocks, volunteer/donate prompts', palette: { primary: '#2b1540', accent: '#e14f3d' } }
    ], pages: ['Home','About','Projects','Gallery','Contact'], title: 'Community Programs', offers: ['Mission','Programs','Support Us']
  },
  {
    type: 'Portfolio / Film / Creator', key: 'creator', styles: [
      { key: 'cinematic', name: 'Cinematic', art: '🎬', mood: 'film reel, dramatic showcase', visual: 'Cinematic film strips, reel cards, dramatic portfolio lighting', palette: { primary: '#12081f', accent: '#7a36d6' } },
      { key: 'cartoon-creative', name: 'Cartoon Creative', art: '🎨', mood: 'playful creative portfolio art', visual: 'Cartoon creative shapes, bright project cards, playful creator style', palette: { primary: '#39115b', accent: '#ff6bba' } }
    ], pages: ['Home','About','Portfolio','Gallery','Contact'], title: 'Creative Work', offers: ['Featured Projects','Media Gallery','Booking']
  },
  {
    type: 'Cleaning / Home Services', key: 'cleaning', styles: [
      { key: 'clean-realistic', name: 'Realistic Clean', art: '✨', mood: 'clean room, sparkle, before-after cards', visual: 'Sparkling room style, before/after gallery cards, clean trust sections', palette: { primary: '#16334a', accent: '#4aa5bd' } },
      { key: 'cartoon-sparkle', name: 'Cartoon Sparkle', art: '🧽', mood: 'cartoon cleaning sparkle and bright icons', visual: 'Cartoon sparkle icons, bright cleaning bubbles, friendly service blocks', palette: { primary: '#1d3750', accent: '#65d0e8' } }
    ], pages: ['Home','Services','Before & After','Testimonials','Contact'], title: 'Cleaning Packages', offers: ['Deep Cleaning','Move-In/Out','Before & After']
  },
  {
    type: 'Coaching / Consulting', key: 'coaching', styles: [
      { key: 'expert-clean', name: 'Clean Expert', art: '📘', mood: 'coach profile and clean service cards', visual: 'Expert profile panels, clean sections, strategy cards', palette: { primary: '#1e2639', accent: '#6c8fc5' } },
      { key: 'luxury-advisor', name: 'Luxury Advisor', art: '💼', mood: 'premium consulting and elegant blocks', visual: 'Luxury advisor cards, elegant sections, premium consultation look', palette: { primary: '#1e1230', accent: '#b98938' } }
    ], pages: ['Home','About','Services','Testimonials','FAQ','Contact'], title: 'Coaching Packages', offers: ['Strategy Session','Group Support','Book a Call']
  },
  {
    type: 'Kids / Party / Fun', key: 'party', styles: [
      { key: 'cartoon-bright', name: 'Cartoon Bright', art: '🎈', mood: 'cartoon party balloons, fun colors', visual: 'Bright cartoon balloons, colorful event blocks, playful layout', palette: { primary: '#5924a4', accent: '#f05688' } },
      { key: 'color-pop', name: 'Bold Color Pop', art: '🎉', mood: 'bold playful event blocks', visual: 'Bold color shapes, party graphics, fun package cards', palette: { primary: '#1b1c72', accent: '#ffb01f' } }
    ], pages: ['Home','Services','Gallery','FAQ','Contact'], title: 'Party Packages', offers: ['Party Setup','Fun Add-ons','Booking Info']
  },
  {
    type: 'Online Shop / Boutique', key: 'shop', styles: [
      { key: 'luxury-product', name: 'Luxury Product', art: '🛍️', mood: 'premium product display', visual: 'Luxury product shelves, boutique cards, elegant shop layout', palette: { primary: '#20172f', accent: '#c77a6d' } },
      { key: 'storefront-realistic', name: 'Realistic Storefront', art: '🏬', mood: 'storefront, boutique shelves, product cards', visual: 'Realistic storefront, product gallery, shop section cards', palette: { primary: '#252238', accent: '#d28e2e' } }
    ], pages: ['Home','Products','Gallery','FAQ','Contact'], title: 'Featured Products', offers: ['New Arrivals','Best Sellers','How to Order']
  }
];

export function slugify(text = '') {
  return String(text).toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'my-website';
}


export function defaultCustomerActionsForType(typeKey = 'local') {
  const map = {
    food: [{ label: 'Order Now', type: 'order', value: '', note: 'Add your order form, menu, or checkout link.' }],
    beauty: [{ label: 'Book Appointment', type: 'book', value: '', note: 'Add your booking calendar or contact link.' }],
    realestate: [{ label: 'Request Info', type: 'quote', value: '', note: 'Add your property inquiry or consultation link.' }],
    wellness: [{ label: 'Book Consultation', type: 'book', value: '', note: 'Add your consultation or program link.' }],
    local: [{ label: 'Request Quote', type: 'quote', value: '', note: 'Add your quote form or contact link.' }],
    digital: [{ label: 'Buy Now', type: 'buy', value: '', note: 'Add your Gumroad, Stripe, Square, or product link.' }],
    nonprofit: [{ label: 'Support Us', type: 'custom', value: '', note: 'Add your donation, volunteer, or contact link.' }],
    creator: [{ label: 'Book a Project', type: 'book', value: '', note: 'Add your booking, portfolio, or inquiry link.' }],
    cleaning: [{ label: 'Book Cleaning', type: 'book', value: '', note: 'Add your cleaning quote or booking link.' }],
    coaching: [{ label: 'Book a Call', type: 'book', value: '', note: 'Add your consultation calendar link.' }],
    party: [{ label: 'Book Event', type: 'book', value: '', note: 'Add your event booking or package link.' }],
    shop: [{ label: 'Shop Now', type: 'buy', value: '', note: 'Add your product checkout or shop link.' }]
  };
  return map[typeKey] || [{ label: 'Contact Us', type: 'email', value: '', note: 'Add your contact link.' }];
}

export function getTemplate(typeKey = 'local', styleKey) {
  const type = templateLibrary.find(t => t.key === typeKey) || templateLibrary.find(t => t.key === 'local') || templateLibrary[0];
  const style = type.styles.find(s => s.key === styleKey) || type.styles[0];
  return { type, style };
}

export function createDefaultSite(overrides = {}) {
  const { type, style } = getTemplate(overrides.typeKey || 'local', overrides.styleKey);
  return {
    businessName: 'My Business Name',
    draftName: '',
    customerEmail: '',
    phone: '',
    typeKey: type.key,
    styleKey: style.key,
    plan: 'free',
    headline: 'A beautiful website created in minutes.',
    description: 'Add your business details, services, products, and contact information so customers know what you offer.',
    primaryColor: style.palette?.primary || '#20172f',
    accentColor: style.palette?.accent || '#c46a2d',
    heroImage: '',
    heroMediaLink: '',
    fontStyle: 'bold',
    layoutStyle: 'split',
    backgroundStyle: 'gradient',
    sectionShape: 'cards',
    pages: ['Home'],
    desiredPages: type.pages,
    offerTitle: type.title,
    offers: type.offers.map((name, i) => ({ title: name, text: i === 0 ? 'Describe this offer in your own words.' : i === 1 ? 'Explain what makes this helpful or special.' : 'Tell visitors what to do next.' })),
    sections: {
      Home: 'Welcome visitors and explain what your business does.',
      About: 'Share your story, your mission, and why customers should trust you.',
      Services: 'List your services, packages, or main business offers.',
      Menu: 'Add menu items, specials, prices, or order details.',
      Products: 'Show products, benefits, prices, or how customers can buy.',
      Gallery: 'Add photos, video links, portfolio samples, or proof of your work.',
      Portfolio: 'Show your projects, creative work, or past results.',
      Projects: 'Highlight recent work, case studies, or featured projects.',
      'Before & After': 'Show transformations, before/after examples, or progress photos.',
      Testimonials: 'Add customer reviews and trust-building comments.',
      FAQ: 'Answer common questions customers may have.',
      'Order / Book / Buy': 'Ready to get started? Choose an option below to order, book, buy, request a quote, or contact us.',
      Contact: 'Tell visitors how to contact, book, order, or ask questions.'
    },
    media: [],
    customerActions: defaultCustomerActionsForType(type.key),
    ...overrides
  };
}


export function planSectionLimit(plan = 'free') {
  const info = plans[plan] || plans.free;
  return Number(info.maxSections || info.maxPages || 1);
}

export function planAllowsMedia(plan = 'free') {
  return Boolean((plans[plan] || plans.free).mediaUploads);
}

export function planAllowsAiVideo(plan = 'free') {
  return Boolean((plans[plan] || plans.free).aiVideo);
}

export function customerActionLimit(plan = 'free') {
  if (plan === 'premium') return 8;
  if (plan === 'business') return 4;
  if (plan === 'starter') return 2;
  return 1;
}

export const customerActionTypes = [
  { key: 'call', label: 'Call Now', placeholder: '555-123-4567' },
  { key: 'text', label: 'Text Us', placeholder: '555-123-4567' },
  { key: 'email', label: 'Email Us', placeholder: 'hello@example.com' },
  { key: 'book', label: 'Book Appointment', placeholder: 'https://calendly.com/your-link' },
  { key: 'order', label: 'Order Now', placeholder: 'https://your-order-form-or-menu-link.com' },
  { key: 'buy', label: 'Buy Now', placeholder: 'https://your-product-checkout-link.com' },
  { key: 'quote', label: 'Request Quote', placeholder: 'https://your-quote-form-link.com' },
  { key: 'menu', label: 'View Menu', placeholder: 'https://your-menu-link.com' },
  { key: 'payment', label: 'Make a Payment', placeholder: 'https://your-payment-link.com' },
  { key: 'custom', label: 'Custom Link', placeholder: 'https://your-link.com' }
];

export function normalizeCustomerActions(actions = [], plan = 'free') {
  const limit = customerActionLimit(plan);
  const clean = Array.isArray(actions) ? actions : [];
  const normalized = clean
    .filter(action => action && (action.label || action.value || action.type))
    .map(action => ({
      label: String(action.label || 'Contact Us').trim() || 'Contact Us',
      type: String(action.type || 'custom').trim() || 'custom',
      value: String(action.value || '').trim(),
      note: String(action.note || '').trim()
    }));
  return normalized.slice(0, limit || 1);
}

export function normalizeSelectedPagesForPlan(pages = ['Home'], plan = 'free') {
  const limit = planSectionLimit(plan);
  const raw = Array.isArray(pages) && pages.length ? pages : ['Home'];
  const clean = [];
  if (raw.includes('Home')) clean.push('Home');
  else clean.push('Home');
  raw.forEach(page => {
    if (page !== 'Home' && pageOptions.includes(page) && !clean.includes(page)) clean.push(page);
  });
  if (limit >= 99) return clean;
  return clean.slice(0, limit);
}

export function visiblePagesForPlan(site) {
  return normalizeSelectedPagesForPlan(site?.pages || ['Home'], site?.plan || 'free');
}
