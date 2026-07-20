import Link from 'next/link';
import Nav from '../../lib/Nav';

const checkoutLinks = {
  starter: '/checkout/starter',
  business: '/checkout/business',
  premium: '/checkout/premium',
  extra: '/checkout/extra',
};

const planImages = [
  {
    name: 'Starter Pro',
    price: '$19/month',
    desc: 'Best for a clean one-page professional website.',
    img: '/gumroad-plan-images/starter-pro.png',
    href: checkoutLinks.starter,
  },
  {
    name: 'Business',
    price: '$30/month',
    desc: 'Best for growing brands that need more pages and sections.',
    img: '/gumroad-plan-images/business.png',
    href: checkoutLinks.business,
  },
  {
    name: 'Premium',
    price: '$50/month',
    desc: 'Best for fuller brands that want the most complete website option.',
    img: '/gumroad-plan-images/premium.png',
    href: checkoutLinks.premium,
  },
  {
    name: 'Extra Page Add-On',
    price: '$10/month per page',
    desc: 'Add more pages as the customer website grows.',
    img: '/gumroad-plan-images/extra-page-addon.png',
    href: checkoutLinks.extra,
  },
];

const cards = [
  ['Free Launch Page','$0','One free basic launch page to start building and publishing.'],
  ['Starter Pro','$19/mo','One professional page, dashboard access, save drafts, publish, and customer subdomain.'],
  ['Business','$30/mo','Up to 3 pages for small businesses, creators, and service providers.'],
  ['Premium','$50/mo','Most complete plan with the strongest page and section access.'],
  ['Extra Page','$10/mo','Add one extra page to Starter or Business.'],
];

export default function Pricing(){
  return (
    <>
      <Nav />
      <main className="wrap pricingPage">
        <span className="kicker">Simple subscriptions</span>
        <h1>Choose the plan that fits your website.</h1>
        <p className="leadText">Start free, save a draft, then upgrade when you need more pages, stronger features, or AI Video Studio access.</p>

        <section className="pricingImageIntro">
          <div className="card">
            <span className="kicker">Launch ready</span>
            <h2>Professional plan graphics are now part of your site.</h2>
            <p>
              These images match your Gumroad products so visitors see the same polished brand before checkout and after they reach Gumroad.
            </p>
            <p>
              <Link className="btn" href="/builder">Start Free</Link>{' '}
              <Link className="btn dark" href="/customer-start">How It Works</Link>
            </p>
          </div>
          <div className="featuredPlanImage">
            <img src="/gumroad-plan-images/business.png" alt="Business plan promotional graphic" />
          </div>
        </section>

        <div className="planAccuracyNote">
          <strong>Current launch website address:</strong> customername.cookiesdigitalcreations.com. Custom domain support is planned for a later Premium/add-on upgrade, so the written plan details on this page are the current live offer.
        </div>

        <section className="planImageGrid" aria-label="Plan image gallery">
          {planImages.map((plan) => (
            <article className="planImageCard" key={plan.name}>
              <img src={plan.img} alt={`${plan.name} plan graphic`} />
              <h2>{plan.name}</h2>
              <p><strong>{plan.price}</strong></p>
              <p>{plan.desc}</p>
              <Link className="btn" href={plan.href}>Choose {plan.name}</Link>
            </article>
          ))}
        </section>

        <section className="cardGrid">
          {cards.map(([name,price,desc]) => (
            <div className="card" key={name}>
              <h2>{name}</h2>
              <div className="price">{price}</div>
              <p>{desc}</p>
              <Link className="btn" href={name === 'Free Launch Page' ? '/builder' : '/builder'}>Start Here</Link>
            </div>
          ))}
        </section>

        <div className="notice">
          <strong>Cookie Credits and AI Video:</strong> website pages are subscription-based. AI video access depends on the customer plan and the available video limits connected to the platform.
        </div>

        <section className="customerQuickPanel">
          <div>
            <h2>Need help deciding?</h2>
            <p>Use the customer guide to see how building, saving drafts, checkout, and publishing work before you begin.</p>
          </div>
          <Link className="btn dark" href="/customer-start">Open Customer Guide</Link>
        </section>
      </main>
    </>
  );
}
