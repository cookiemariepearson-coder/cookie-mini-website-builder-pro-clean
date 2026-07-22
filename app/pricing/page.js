import Link from 'next/link';
import Nav from '../../lib/Nav';

const websitePlans = [
  {
    name: 'Free Launch Page',
    price: '$0',
    desc: 'Choose up to 3 sections for a simple starter launch page.',
    href: '/builder',
    cta: 'Start Free',
  },
  {
    name: 'Starter Pro',
    price: '$19/month',
    desc: 'Choose up to 4 sections with image/video upload options.',
    href: '/checkout/starter',
    cta: 'Choose Starter Pro',
  },
  {
    name: 'Business',
    price: '$30/month',
    desc: 'Choose up to 6 sections with upload/media options and AI Video Studio access.',
    href: '/checkout/business',
    cta: 'Choose Business',
    featured: true,
  },
  {
    name: 'Premium',
    price: '$50/month',
    desc: 'Use all built-in sections with upload/media options and the strongest AI Video Studio access.',
    href: '/checkout/premium',
    cta: 'Choose Premium',
  },
  {
    name: 'Extra Page Add-On',
    price: '$10/month per page',
    desc: 'Add extra page/section space as the customer website grows.',
    href: '/checkout/extra',
    cta: 'Choose Extra Page Add-On',
  },
];

export default function Pricing(){
  return (
    <>
      <Nav />
      <main className="wrap pricingPage cleanPricingPage">
        <section className="pricingHeaderCard">
          <span className="kicker">Website plans</span>
          <h1>Choose the plan that fits your content.</h1>
          <p>
            Start with the sections you need today, then upgrade when your website needs more room, media options, or AI Video Studio access.
          </p>
          <div className="pricingHeaderActions">
            <Link className="btn" href="/builder">Start Free</Link>
            <Link className="btn dark" href="/checkout/ai-video">AI Video Studio — $5</Link>
          </div>
        </section>

        <section className="cleanPlanGrid" aria-label="Cookie Mini Website Builder plan options">
          {websitePlans.map((plan) => (
            <article className={plan.featured ? 'cleanPlanCard featuredCleanPlanCard' : 'cleanPlanCard'} key={plan.name}>
              {plan.featured && <div className="popularRibbon">Most Popular</div>}
              <h2>{plan.name}</h2>
              <div className="cleanPlanPrice">{plan.price}</div>
              <p>{plan.desc}</p>
              <Link className="btn" href={plan.href}>{plan.cta}</Link>
            </article>
          ))}
        </section>

        <section className="standaloneVideoCard">
          <div>
            <span className="kicker">Need video only?</span>
            <h2>AI Video Studio — $5</h2>
            <p>
              Use this option for customers who want help creating a promotional social media video but do not need a website plan.
            </p>
          </div>
          <Link className="btn dark" href="/checkout/ai-video">Start AI Video Checkout</Link>
        </section>

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
