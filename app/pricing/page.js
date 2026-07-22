import Link from 'next/link';
import Nav from '../../lib/Nav';

const websitePlans = [
  {
    name: 'Free Launch Page',
    price: '$0',
    desc: 'Up to 3 selected sections for a simple starter launch page.',
    actions: '1 customer action button',
    href: '/builder',
    cta: 'Start Free',
  },
  {
    name: 'Starter Pro',
    price: '$19/month',
    desc: 'Up to 4 selected sections with image/video upload options.',
    actions: 'Up to 2 customer action buttons',
    href: '/checkout/starter',
    cta: 'Choose Starter Pro',
  },
  {
    name: 'Business',
    price: '$30/month',
    desc: 'Up to 6 selected sections with media options and AI Video Studio access.',
    actions: 'Up to 4 customer action buttons',
    href: '/checkout/business',
    cta: 'Choose Business',
    featured: true,
  },
  {
    name: 'Premium',
    price: '$50/month',
    desc: 'All built-in sections with media options and the strongest AI Video Studio access.',
    actions: 'Up to 8 customer action buttons',
    href: '/checkout/premium',
    cta: 'Choose Premium',
  },
  {
    name: 'Extra Page Add-On',
    price: '$10/month per page',
    desc: 'Extra page/section space as the customer website grows.',
    actions: 'Add more room when needed',
    href: '/checkout/extra',
    cta: 'Choose Extra Page Add-On',
  },
];

export default function Pricing(){
  return (
    <>
      <Nav />
      <main className="wrap pricingPage premiumPricingPage">
        <section className="pricingHeaderCard premiumPricingHeader">
          <span className="kicker">Website plans</span>
          <h1>Choose the plan that fits your content.</h1>
          <p>
            Each plan includes a clear website path plus customer action buttons so visitors can order, book, buy, request a quote, or contact the business.
          </p>
          <div className="pricingHeaderActions">
            <Link className="btn" href="/builder">Start Free</Link>
            <Link className="btn dark" href="/checkout/ai-video">AI Video Studio — $5</Link>
          </div>
        </section>

        <section className="cleanPlanGrid premiumPlanGrid" aria-label="Cookie Mini Website Builder plan options">
          {websitePlans.map((plan) => (
            <article className={plan.featured ? 'cleanPlanCard featuredCleanPlanCard premiumPlanCard featuredPremiumPlanCard' : 'cleanPlanCard premiumPlanCard'} key={plan.name}>
              {plan.featured && <div className="popularRibbon">Most Popular</div>}
              <h2>{plan.name}</h2>
              <div className="cleanPlanPrice">{plan.price}</div>
              <p>{plan.desc}</p>
              <div className="planActionLimit">{plan.actions}</div>
              <Link className="btn" href={plan.href}>{plan.cta}</Link>
            </article>
          ))}
        </section>

        <section className="standaloneVideoCard premiumVideoCta">
          <div>
            <span className="kicker">Need video only?</span>
            <h2>AI Video Studio — $5</h2>
            <p>
              A separate option for customers who want video ideas, hooks, scripts, captions, and scene planning without purchasing a website plan.
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
