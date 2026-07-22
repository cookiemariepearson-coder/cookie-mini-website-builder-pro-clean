import Link from 'next/link';
import Nav from '../lib/Nav';
import OwnerFooter from '../lib/OwnerFooter';

const planTiles = [
  ['Free Launch Page', '$0', 'Up to 3 selected sections', '1 action button'],
  ['Starter Pro', '$19/mo', 'Up to 4 selected sections', '2 action buttons + media uploads'],
  ['Business', '$30/mo', 'Up to 6 selected sections', '4 action buttons + AI Video Studio'],
  ['Premium', '$50/mo', 'All built-in sections', '8 action buttons + strongest AI Video Studio'],
  ['Extra Page Add-On', '$10/mo', 'Per page/section space', 'Grow when you need more']
];

export default function Home(){
  return (
    <>
      <Nav />
      <main className="brandLanding">
        <section className="brandHero">
          <div>
            <span className="kicker">Cookie Digital Creations</span>
            <h1>Build. Book. Sell. Grow.</h1>
            <p>
              Create a polished website that gives visitors a clear way to contact you, book with you,
              order from you, buy from you, request a quote, or get started.
            </p>
            <div className="heroButtonRow">
              <Link className="btn" href="/builder">Start Building Free</Link>
              <Link className="btn dark" href="/pricing">View Website Plans</Link>
              <Link className="btn light" href="/checkout/ai-video">AI Video Studio — $5</Link>
            </div>
          </div>
          <div className="brandHeroMockup" aria-label="Website builder preview">
            <div className="mockBrowser">
              <div className="mockDots"><span></span><span></span><span></span></div>
              <h3>Your Business</h3>
              <h2>A beautiful website that gets customers moving.</h2>
              <div className="mockActionRow">
                <span>Order Now</span>
                <span>Book Appointment</span>
                <span>Request Quote</span>
              </div>
              <div className="mockCards"><span></span><span></span><span></span></div>
            </div>
          </div>
        </section>

        <section className="brandSection">
          <span className="kicker">Customer action tools</span>
          <h2>Every website needs a next step.</h2>
          <p>
            Add buttons for calls, texts, email, booking links, order forms, payment links, menu links,
            Gumroad products, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, or any custom link.
          </p>
          <div className="actionFeatureGrid">
            <div><strong>Order</strong><small>Food, products, services, forms, and custom order links.</small></div>
            <div><strong>Book</strong><small>Appointments, consultations, beauty services, sessions, and events.</small></div>
            <div><strong>Buy</strong><small>Products, digital items, bundles, payment pages, or checkout links.</small></div>
            <div><strong>Contact</strong><small>Call, text, email, inquiry forms, quotes, and customer questions.</small></div>
          </div>
        </section>

        <section className="brandPlanSection">
          <div>
            <span className="kicker">Plans that grow with you</span>
            <h2>Start simple. Add more when your business needs it.</h2>
          </div>
          <div className="brandPlanGrid">
            {planTiles.map(([name, price, detail, actions]) => (
              <article className="brandPlanTile" key={name}>
                <strong>{name}</strong>
                <span>{price}</span>
                <small>{detail}</small>
                <em>{actions}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="brandSplitCta">
          <div>
            <span className="kicker">Need video only?</span>
            <h2>Cookie’s AI Video Studio is available separately.</h2>
            <p>Use the $5 AI Video Studio option for video ideas, hooks, scripts, captions, and scene planning without buying a website plan.</p>
          </div>
          <Link className="btn" href="/checkout/ai-video">Start AI Video Studio</Link>
        </section>

        <section className="wrap cardGrid">
          <div className="card">
            <h2>Purpose-based templates</h2>
            <p>Food, beauty, real estate, wellness, cleaning, coaching, portfolio, shops, nonprofit, and more.</p>
          </div>
          <div className="card">
            <h2>Drafts and dashboard</h2>
            <p>Customers can save drafts, return by email or website name, and edit published websites.</p>
          </div>
          <div className="card">
            <h2>Built to convert</h2>
            <p>Your site can show clear action buttons so visitors know exactly how to order, book, buy, or contact the business.</p>
          </div>
        </section>
        <OwnerFooter />
      </main>
    </>
  );
}
