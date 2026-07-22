import Link from 'next/link';
import Nav from '../../lib/Nav';

const checkoutLinks = {
  starter: '/checkout/starter',
  business: '/checkout/business',
  premium: '/checkout/premium',
  extra: '/checkout/extra',
};

const currentPlans = [
  {
    name: 'Free Launch Page',
    price: '$0',
    desc: 'Includes up to 3 selected sections for a simple starter launch page.',
    href: '/builder',
    type: 'free',
  },
  {
    name: 'Starter Pro',
    price: '$19/month',
    desc: 'Includes up to 4 selected sections plus image/video upload options.',
    img: '/gumroad-plan-images/starter-pro.png',
    href: checkoutLinks.starter,
  },
  {
    name: 'Business',
    price: '$30/month',
    desc: 'Includes up to 6 selected sections, uploads/media links, and AI Video Studio access.',
    img: '/gumroad-plan-images/business.png',
    href: checkoutLinks.business,
  },
  {
    name: 'Premium',
    price: '$50/month',
    desc: 'Includes all built-in sections, uploads/media links, and the strongest AI Video Studio access.',
    img: '/gumroad-plan-images/premium.png',
    href: checkoutLinks.premium,
  },
  {
    name: 'Extra Page Add-On',
    price: '$10/month per page',
    desc: 'Add extra page/section space as the customer website grows.',
    img: '/gumroad-plan-images/extra-page-addon.png',
    href: checkoutLinks.extra,
  },
];

export default function Pricing(){
  return (
    <>
      <Nav />
      <main className="wrap pricingPage">
        <span className="kicker">Simple subscriptions</span>
        <h1>Choose the plan that fits your website.</h1>
        <p className="leadText">Start free, save a draft, then upgrade when you need more sections, image/video upload options, or AI Video Studio access.</p>

        <section className="pricingOrderStrip" aria-label="Current pricing plan order">
          {currentPlans.map((plan) => (
            <div className="pricingOrderItem" key={plan.name}>
              <strong>{plan.name}</strong>
              <span>{plan.price}</span>
            </div>
          ))}
        </section>

        <section className="pricingImageIntro">
          <div className="card">
            <span className="kicker">Launch ready</span>
            <h2>Accurate plan details are now part of your site.</h2>
            <p>
              The written details below match the current live offer. Replace Gumroad and website images after the new section-based plan graphics are finalized.
            </p>
            <p>
              <Link className="btn" href="/builder">Start Free</Link>{' '}
              <Link className="btn dark" href="/customer-start">How It Works</Link>
            </p>
          </div>
          <div className="pricingPlanSnapshot">
            {currentPlans.map((plan) => (
              <div className="pricingPlanSnapshotItem" key={plan.name}>
                <strong>{plan.name}</strong>
                <span>{plan.price}</span>
                <small>{plan.desc}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="planAccuracyNote">
          <strong>Current launch website address:</strong> customername.cookiesdigitalcreations.com. Custom domain support is planned for a later upgrade, so the written plan details on this page are the current live offer.
        </div>

        <section className="planImageGrid currentPlanImageGrid" aria-label="Current accurate plan list">
          {currentPlans.map((plan) => (
            <article className={plan.type === 'free' ? 'planImageCard freeLaunchPlanCard' : 'planImageCard'} key={plan.name}>
              <div className="accuratePlanBadge" aria-label={plan.name}>
                <strong>{plan.name}</strong>
                <span>{plan.price}</span>
                <small>{plan.desc}</small>
              </div>
              <h2>{plan.name}</h2>
              <p><strong>{plan.price}</strong></p>
              <p>{plan.desc}</p>
              <Link className="btn" href={plan.href}>{plan.type === 'free' ? 'Start Free' : `Choose ${plan.name}`}</Link>
            </article>
          ))}
        </section>

        <div className="notice">
          <strong>Cookie Credits and AI Video:</strong> website sections/pages are subscription-based. AI Video Studio access depends on the customer plan and the available video limits connected to the platform.
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
