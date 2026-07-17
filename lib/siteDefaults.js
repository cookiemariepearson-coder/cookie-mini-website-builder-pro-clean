export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com';

export const plans = {
  free: { label: 'Free Launch Page', price: '$0', maxPages: 1, branding: true, checkout: null },
  starter: { label: 'Starter Pro', price: '$19/mo', maxPages: 1, branding: false, checkoutEnv: 'NEXT_PUBLIC_STARTER_SUBSCRIPTION_CHECKOUT_URL' },
  business: { label: 'Business', price: '$30/mo', maxPages: 3, branding: false, checkoutEnv: 'NEXT_PUBLIC_BUSINESS_SUBSCRIPTION_CHECKOUT_URL' },
  premium: { label: 'Premium', price: '$50/mo', maxPages: 99, branding: false, checkoutEnv: 'NEXT_PUBLIC_PREMIUM_SUBSCRIPTION_CHECKOUT_URL' }
};

export const pageOptions = ['Home','About','Services','Menu','Products','Gallery','Portfolio','Projects','Before & After','Testimonials','FAQ','Contact'];

export const templateLibrary = [
  {
    type: 'Food / Restaurant', key: 'food', styles: [
      { key: 'kitchen-realistic', name: 'Realistic Kitchen', art: '🍳', mood: 'warm kitchen art, plated food, chef energy' },
      { key: 'cartoon-food', name: 'Cartoon Food Fun', art: '🍔', mood: 'bright cartoon food, playful menu cards' }
    ], pages: ['Home','Menu','Gallery','Testimonials','Contact'], title: 'Our Menu', offers: ['Fresh Specials','Signature Plates','Order Info']
  },
  {
    type: 'Beauty / Hair / Salon', key: 'beauty', styles: [
      { key: 'floral-glam', name: 'Soft Floral Glam', art: '🌸', mood: 'flowers, soft luxury, beauty accents' },
      { key: 'luxury-salon', name: 'Luxury Salon', art: '💄', mood: 'glam salon shine, premium service cards' }
    ], pages: ['Home','Services','Gallery','Testimonials','Contact'], title: 'Beauty Services', offers: ['Styling Services','Price Highlights','Booking Details']
  },
  {
    type: 'Real Estate / Investor', key: 'realestate', styles: [
      { key: 'building-pro', name: 'Realistic Buildings', art: '🏢', mood: 'city buildings, property investor look' },
      { key: 'modern-property', name: '3D Modern Property', art: '🏘️', mood: '3D property cards, clean investor layout' }
    ], pages: ['Home','About','Services','Projects','FAQ','Contact'], title: 'Investor Services', offers: ['Property Strategy','Investor Resources','Contact Details']
  },
  {
    type: 'Wellness / Health Product', key: 'wellness', styles: [
      { key: 'flowers-herbs', name: 'Flowers & Herbs', art: '🌿', mood: 'herbs, flowers, calm wellness art' },
      { key: 'clean-minimal', name: 'Clean Minimal', art: '🧘', mood: 'clean calm product showcase' }
    ], pages: ['Home','Products','About','Testimonials','FAQ','Contact'], title: 'Wellness Benefits', offers: ['Natural Benefits','Product Details','Customer Support']
  },
  {
    type: 'Local Services', key: 'local', styles: [
      { key: 'service-3d', name: '3D Modern', art: '🛠️', mood: '3D service desk, booking cards' },
      { key: 'service-realistic', name: 'Realistic Professional', art: '🏪', mood: 'local storefront and trust badges' }
    ], pages: ['Home','Services','About','FAQ','Contact'], title: 'Services & Offers', offers: ['Main Service','Service Highlights','Contact Section']
  },
  {
    type: 'Digital Product Seller', key: 'digital', styles: [
      { key: 'bold-sales', name: 'Bold Sales Page', art: '💻', mood: 'digital product cards, bold sales layout' },
      { key: 'creator-tool', name: '3D Creator Tool', art: '⚙️', mood: 'creator dashboard and 3D app graphics' }
    ], pages: ['Home','Products','FAQ','Testimonials','Contact'], title: 'Product Benefits', offers: ['What It Does','Who It Helps','Buy / Access']
  },
  {
    type: 'Nonprofit / Community', key: 'nonprofit', styles: [
      { key: 'warm-mission', name: 'Warm Mission', art: '🤝', mood: 'community warmth and support' },
      { key: 'bold-action', name: 'Bold Action', art: '📣', mood: 'donate/support call-to-action' }
    ], pages: ['Home','About','Projects','Gallery','Contact'], title: 'Community Programs', offers: ['Mission','Programs','Support Us']
  },
  {
    type: 'Portfolio / Film / Creator', key: 'creator', styles: [
      { key: 'cinematic', name: 'Cinematic', art: '🎬', mood: 'film reel, dramatic showcase' },
      { key: 'cartoon-creative', name: 'Cartoon Creative', art: '🎨', mood: 'playful creative portfolio art' }
    ], pages: ['Home','About','Portfolio','Gallery','Contact'], title: 'Creative Work', offers: ['Featured Projects','Media Gallery','Booking']
  },
  {
    type: 'Cleaning / Home Services', key: 'cleaning', styles: [
      { key: 'clean-realistic', name: 'Realistic Clean', art: '✨', mood: 'clean room, sparkle, before-after cards' },
      { key: 'cartoon-sparkle', name: 'Cartoon Sparkle', art: '🧽', mood: 'cartoon cleaning sparkle and bright icons' }
    ], pages: ['Home','Services','Before & After','Testimonials','Contact'], title: 'Cleaning Packages', offers: ['Deep Cleaning','Move-In/Out','Before & After']
  },
  {
    type: 'Coaching / Consulting', key: 'coaching', styles: [
      { key: 'expert-clean', name: 'Clean Expert', art: '📘', mood: 'coach profile and clean service cards' },
      { key: 'luxury-advisor', name: 'Luxury Advisor', art: '💼', mood: 'premium consulting and elegant blocks' }
    ], pages: ['Home','About','Services','Testimonials','FAQ','Contact'], title: 'Coaching Packages', offers: ['Strategy Session','Group Support','Book a Call']
  },
  {
    type: 'Kids / Party / Fun', key: 'party', styles: [
      { key: 'cartoon-bright', name: 'Cartoon Bright', art: '🎈', mood: 'cartoon party balloons, fun colors' },
      { key: 'color-pop', name: 'Bold Color Pop', art: '🎉', mood: 'bold playful event blocks' }
    ], pages: ['Home','Services','Gallery','FAQ','Contact'], title: 'Party Packages', offers: ['Party Setup','Fun Add-ons','Booking Info']
  },
  {
    type: 'Online Shop / Boutique', key: 'shop', styles: [
      { key: 'luxury-product', name: 'Luxury Product', art: '🛍️', mood: 'premium product display' },
      { key: 'storefront-realistic', name: 'Realistic Storefront', art: '🏬', mood: 'storefront, boutique shelves, product cards' }
    ], pages: ['Home','Products','Gallery','FAQ','Contact'], title: 'Featured Products', offers: ['New Arrivals','Best Sellers','How to Order']
  }
];

export function slugify(text = '') {
  return String(text).toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'my-website';
}

export function getTemplate(typeKey = 'local', styleKey) {
  const type = templateLibrary.find(t => t.key === typeKey) || templateLibrary.find(t => t.key === 'local');
  const style = type.styles.find(s => s.key === styleKey) || type.styles[0];
  return { type, style };
}

export function createDefaultSite(overrides = {}) {
  const { type, style } = getTemplate(overrides.typeKey || 'local', overrides.styleKey);
  return {
    businessName: 'My Business Name',
    customerEmail: '',
    phone: '',
    typeKey: type.key,
    styleKey: style.key,
    plan: 'free',
    headline: 'A beautiful website created in minutes.',
    description: 'Add your business details, services, products, and contact information so customers know what you offer.',
    primaryColor: '#20172f',
    accentColor: '#c46a2d',
    pages: type.pages,
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
      Contact: 'Tell visitors how to contact you, book, order, or ask questions.'
    },
    media: [],
    ...overrides
  };
}

export function visiblePagesForPlan(site) {
  const max = plans[site.plan]?.maxPages || 1;
  if (max >= 99) return site.pages;
  return site.pages.slice(0, max);
}
