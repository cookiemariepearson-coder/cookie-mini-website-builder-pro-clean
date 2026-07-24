// Done-for-You pricing page
import Link from 'next/link';
import Nav from '../../lib/Nav';

const servicePlans = [
  {
    name: 'Free Launch Page',
    setup: '$99 setup',
    monthly: '$0/month',
    tone: 'sunset',
    summary: 'A simple, polished online starting point for a new idea, event, service, or small business.',
    includes: [
      'I build and format the one-page website for you',
      'Up to 3 selected sections',
      '1 customer action button',
      'Your business name, wording, colors, and contact details',
      'Customer-provided photos added',
      'Mobile-friendly setup and final review',
      '1 revision round',
    ],
  },
  {
    name: 'Starter Pro',
    setup: '$249 setup',
    monthly: '$19/month',
    tone: 'berry',
    summary: 'Best for a one-page business website that needs stronger content, media, and customer actions.',
    includes: [
      'Everything in the Free Launch setup',
      'Up to 4 selected sections',
      'Up to 2 customer action buttons',
      'Photo or video uploads added',
      'Booking, ordering, buying, calling, texting, or email links',
      'Basic wording cleanup and section organization',
      '2 revision rounds',
    ],
  },
  {
    name: 'Business',
    setup: '$499 setup',
    monthly: '$30/month',
    tone: 'gold',
    badge: 'Most Popular',
    summary: 'Built for active businesses that need more sections, customer actions, and promotional support.',
    includes: [
      'Everything in the Starter Pro setup',
      'Up to 6 selected sections',
      'Up to 4 customer action buttons',
      'Expanded services, products, gallery, testimonials, contact, or FAQ content',
      'AI Video Studio access included with the plan',
      'Stronger call-to-action placement',
      'Basic launch guidance',
      '3 revision rounds',
    ],
  },
  {
    name: 'Premium',
    setup: '$899 setup',
    monthly: '$50/month',
    tone: 'violet',
    summary: 'The complete done-for-you option for a business that wants the fullest website and launch support.',
    includes: [
      'Everything in the Business setup',
      'All available built-in sections',
      'Up to 8 customer action buttons',
      'Full photo and video organization',
      'Strongest AI Video Studio access',
      'Detailed section wording and content placement',
      'Priority setup and launch review',
      '4 revision rounds',
    ],
  },
];

const emailHref = (plan) =>
  `mailto:cookiepearson@gmail.com?subject=${encodeURIComponent(`Done-for-You Website Request — ${plan}`)}&body=${encodeURIComponent(`Hello Cookie Digital Creations,\n\nI am interested in the ${plan} Done-for-You website service.\n\nBusiness name:\nBusiness type:\nWhat I need customers to do:\nBest email or phone number:\n\nPlease contact me with the next steps.`)}`;

export default function DoneForYouPricing() {
  return (
    <>
      <Nav />
      <main className="wrap doneForYouPage">
        <section className="pricingHeaderCard doneForYouHero">
          <span className="kicker">Cookie Digital Creations</span>
          <h1>Don&apos;t want to build it yourself? I can build it for you.</h1>
          <p>
            Choose the website plan that fits your business, then add the one-time setup service.
            I will organize your content, add your photos and links, and prepare your website for launch.
          </p>
          <div className="pricingHeaderActions">
            <a className="btn" href={emailHref('Website Setup Consultation')}>Request My Website</a>
            <Link className="btn dark" href="/pricing">Compare DIY Plans</Link>
          </div>
        </section>

        <section className="dfyNotice" aria-label="How pricing works">
          <div><strong>One-time setup fee</strong><span>Pays Cookie Digital Creations to build and prepare the website for you.</span></div>
          <div><strong>Monthly website plan</strong><span>Keeps the selected paid website plan active after launch.</span></div>
          <div><strong>You provide the content</strong><span>Send your logo, photos, business details, services, prices, and preferred contact links.</span></div>
        </section>

        <section className="dfyPlanGrid" aria-label="Done-for-You website service plans">
          {servicePlans.map((plan) => (
            <article className={`dfyPlanCard ${plan.tone}`} key={plan.name}>
              {plan.badge && <div className="popularRibbon">{plan.badge}</div>}
              <span className="dfyPlanLabel">Done-for-You</span>
              <h2>{plan.name}</h2>
              <div className="dfyPrice">{plan.setup}</div>
              <div className="dfyMonthly">plus {plan.monthly}</div>
              <p>{plan.summary}</p>
              <h3>What I will do:</h3>
              <ul>
                {plan.includes.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a className="btn" href={emailHref(plan.name)}>Request {plan.name}</a>
            </article>
          ))}
        </section>

        <section className="dfyExtraPage">
          <div>
            <span className="kicker">Need more room?</span>
            <h2>Extra Page Add-On</h2>
            <p>
              I will build and format an additional page for <strong>$125 one-time setup</strong>,
              plus the existing <strong>$10/month per-page plan fee</strong>.
            </p>
          </div>
          <a className="btn dark" href={emailHref('Extra Page Add-On')}>Request an Extra Page</a>
        </section>

        <section className="dfyDetailsGrid">
          <article className="card">
            <span className="stepBadge">1</span>
            <h2>Choose a service</h2>
            <p>Select the Done-for-You plan that matches the amount of content and customer actions you need.</p>
          </article>
          <article className="card">
            <span className="stepBadge">2</span>
            <h2>Send your information</h2>
            <p>Provide your wording, logo, photos, services, prices, social links, and contact or checkout information.</p>
          </article>
          <article className="card">
            <span className="stepBadge">3</span>
            <h2>I build your website</h2>
            <p>I organize and enter your content, add your customer-action links, and prepare a polished draft for review.</p>
          </article>
          <article className="card">
            <span className="stepBadge">4</span>
            <h2>Review and launch</h2>
            <p>You review the included draft, request any included revisions, and approve the website for launch.</p>
          </article>
        </section>

        <section className="customerQuickPanel">
          <div>
            <h2>Not sure which service fits?</h2>
            <p>Tell me about your business and what customers need to do. I will help you choose the best option.</p>
          </div>
          <a className="btn dark" href={emailHref('Help Choosing a Done-for-You Plan')}>Ask Cookie Digital Creations</a>
        </section>

        <section className="dfyFinePrint">
          <h2>Before we begin</h2>
          <p>
            Setup pricing covers the work listed for the selected service. Customers must provide content they own or
            have permission to use. Custom coding, paid stock media, logo design, copywriting beyond basic wording cleanup,
            outside subscriptions, and major changes beyond the included revisions may require a separate quote.
          </p>
        </section>
      </main>
    </>
  );
}
