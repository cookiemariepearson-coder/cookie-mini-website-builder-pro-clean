import Link from 'next/link';
import Nav from '../lib/Nav';
import OwnerFooter from '../lib/OwnerFooter';
import LandingWelcomeExperience from '../components/LandingWelcomeExperience';
import CustomerAccountLink from '../components/CustomerAccountLink';
import { AccountAction } from '../components/AccountModalProvider';
import CustomerHeroAccountPrompt from '../components/CustomerHeroAccountPrompt';
import AmazonAffiliateSpot from '../components/AmazonAffiliateSpot';
import './landing-home-refresh.css';

const planTiles = [
  ['Free Launch Page', '$0', 'Up to 3 selected sections', '1 action button'],
  ['Starter Pro', '$19/mo', 'Up to 4 selected sections', '2 action buttons + media uploads'],
  ['Business', '$30/mo', 'Up to 6 selected sections', '4 action buttons + AI Video Studio'],
  ['Premium', '$50/mo', 'All built-in sections', '8 action buttons + strongest AI Video Studio'],
  ['Extra Page Add-On', '$10/mo', 'Per page/section space', 'Grow when you need more']
];

export const metadata = {
  alternates: { canonical: '/' },
  description: 'Build and publish a mobile-friendly business website with clear booking, ordering, buying, quote, and contact actions.'
};

export default function Home(){
  const faqs = [
    ['Can I build a website for free?', 'Yes. The Free Launch Page lets you create a simple text-based page with up to three selected sections and one customer action button.'],
    ['Can Cookie Digital Creations build the website for me?', 'Yes. Choose Done-for-You Website Services if you want Cookie Digital Creations to set up the design, wording, sections, and customer action path for you.'],
    ['Can customers book, order, buy, or request a quote?', 'Yes. You can add clear action buttons that connect visitors to your booking page, order form, checkout, payment link, quote form, phone, text, or email.'],
    ['Are these websites AI-friendly?', 'The builder uses clear headings, written descriptions, mobile-friendly layouts, consistent business information, and concise FAQs to help people and AI-assisted shopping tools understand what a business offers.'],
    ['Does the builder include AI video creation?', 'Business and Premium plans include eligible AI Video Studio credits. A standalone AI Video Studio option is also available. Plan limits and available credits apply.'],
    ['Can I sell digital products or services?', 'Yes. Add Buy Now, Order Now, Book Now, or another action button linking to Gumroad, a payment page, an order form, or your preferred selling tool.']
  ];
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
  const applicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cookie Mini Website Builder Pro',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://www.cookiesdigitalcreations.com/',
    provider: {
      '@type': 'Organization',
      name: 'Cookie Digital Creations',
      url: 'https://www.cookiesdigitalcreations.com/'
    },
    offers: [
      { '@type': 'Offer', name: 'Free Launch Page', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Starter Pro', price: '19', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Business', price: '30', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Premium', price: '50', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'AI Video Studio standalone', price: '5', priceCurrency: 'USD' }
    ]
  };
  return (
    <>
      <Nav />
      <main className="brandLanding">
        <AmazonAffiliateSpot />
        <section className="brandHero">
          <span className="landingBuildMarker" aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Landing experience V4</span>
          <div>
            <span className="kicker">Cookie Digital Creations</span>
            <h1>Build. Book. Sell. Grow.</h1>
            <p>
              Create a polished website that gives visitors a clear way to contact you, book with you,
              order from you, buy from you, request a quote, or get started.
            </p>
            <div className="heroButtonRow heroButtonRowClean">
              <AccountAction className="btn" destination="/builder" guestAllowed mode="create">Start Building Free</AccountAction>
              <Link className="btn light" href="#featured-templates">Explore Templates</Link>
            </div>
            <CustomerHeroAccountPrompt />
            <p className="aiReviewNote">Created with the assistance of AI and professionally reviewed by Cookie Digital Creations for quality and accuracy.</p>
            <LandingWelcomeExperience />
          </div>
          <div className="brandHeroMockup" aria-label="Preview of a website template customers can customize">
            <div className="mockBrowser">
              <div className="mockBrowserBar"><span className="mockDots"><i></i><i></i><i></i></span><span className="mockBrowserAddress">yourbusiness.com</span><span className="mockLiveLabel">Template preview</span></div>
              <img className="heroTemplatePhoto" src="/templates/beauty/luxury-hero-v3.webp" alt="Luxury beauty website template preview available in the Mini Website Builder" />
              <div className="heroTemplateCaption">
                <span className="kicker">Choose it. Make it yours.</span>
                <h2>A beautiful website, built around your business.</h2>
                <p>Start with a template, personalize your content, and give customers a clear next step.</p>
                <Link className="heroTemplateLink" href="/builder">Create your version <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="featuredTemplatesSection" id="featured-templates" aria-labelledby="featured-templates-heading">
          <div className="featuredTemplatesIntro">
            <span className="kicker">A peek inside the builder</span>
            <h2 id="featured-templates-heading">Start with a look that fits your business.</h2>
            <p>Explore a few of the template styles already available in the Mini Builder. Pick a direction, then make it your own with your business name, colors, photos, and customer action buttons.</p>
          </div>
          <div className="featuredTemplatesGrid">
            <article className="featuredTemplateCard">
              <img src="/templates/food/coastal-hero-v2.webp" alt="Coastal-inspired food and catering website template preview" loading="lazy" />
              <div className="featuredTemplateCopy"><span className="templateCategory">Food &amp; catering</span><h3>Coastal Kitchen</h3><p>Show off your menu, specialties, and ordering options.</p><Link href="/builder" className="templateCardLink">Use this style <span aria-hidden="true">↗</span></Link></div>
            </article>
            <article className="featuredTemplateCard">
              <img src="/templates/beauty/luxury-hero-v3.webp" alt="Elegant beauty and salon website template preview" loading="lazy" />
              <div className="featuredTemplateCopy"><span className="templateCategory">Beauty &amp; salon</span><h3>Luxury Beauty</h3><p>Highlight services, appointments, and your signature look.</p><Link href="/builder" className="templateCardLink">Use this style <span aria-hidden="true">↗</span></Link></div>
            </article>
            <article className="featuredTemplateCard">
              <img src="/templates/realestate/residential-hero-v1.webp" alt="Residential real estate website template preview" loading="lazy" />
              <div className="featuredTemplateCopy"><span className="templateCategory">Real estate</span><h3>Residential Realty</h3><p>Present properties, services, and easy inquiry options.</p><Link href="/builder" className="templateCardLink">Use this style <span aria-hidden="true">↗</span></Link></div>
            </article>
            <article className="featuredTemplateCard">
              <img src="/templates/wellness/botanical-hero-v1.webp" alt="Botanical wellness website template preview" loading="lazy" />
              <div className="featuredTemplateCopy"><span className="templateCategory">Wellness</span><h3>Botanical Wellness</h3><p>Share your approach, offerings, and ways to connect.</p><Link href="/builder" className="templateCardLink">Use this style <span aria-hidden="true">↗</span></Link></div>
            </article>
            <article className="featuredTemplateCard">
              <img src="/templates/cleaning/premium-hero-v1.webp" alt="Professional cleaning service website template preview" loading="lazy" />
              <div className="featuredTemplateCopy"><span className="templateCategory">Home services</span><h3>Premium Cleaning</h3><p>Build trust with clear services and quote requests.</p><Link href="/builder" className="templateCardLink">Use this style <span aria-hidden="true">↗</span></Link></div>
            </article>
            <article className="featuredTemplateCard">
              <img src="/templates/creator/cinematic-hero-v1.webp" alt="Cinematic creator portfolio website template preview" loading="lazy" />
              <div className="featuredTemplateCopy"><span className="templateCategory">Creators &amp; portfolios</span><h3>Cinematic Creator</h3><p>Put your work, personality, and offers front and center.</p><Link href="/builder" className="templateCardLink">Use this style <span aria-hidden="true">↗</span></Link></div>
            </article>
          </div>
          <div className="featuredTemplatesFooter"><p>These are previews of styles available in the builder—not separate paid products.</p><div className="featuredTemplatesActions"><AccountAction className="btn" destination="/builder" guestAllowed mode="create">Browse Templates in the Builder</AccountAction><button type="button" className="templateHelpLink" data-cookie-ai-open="Help me choose a Mini Builder template for my business">Questions? Ask Cookie AI</button></div></div>
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
            <p>Use the $5 one-time AI Video Studio option for planning tools plus one real AI-generated video, without buying a website plan. Provider processing, moderation, and availability apply.</p>
          </div>
          <Link className="btn" href="/video-studio?intent=purchase">Start AI Video Studio</Link>
        </section>

        <section className="wrap cardGrid">
          <div className="card">
            <h2>Purpose-based templates</h2>
            <p>Food, beauty, real estate, wellness, cleaning, coaching, portfolio, shops, nonprofit, and more.</p>
          </div>
          <div className="card">
            <h2>Drafts and dashboard</h2>
            <p>Customers can save drafts, sign in securely to My Websites, filter their own records, and edit published websites.</p>
          </div>
          <div className="card">
            <h2>Built to convert</h2>
            <p>Your site can show clear action buttons so visitors know exactly how to order, book, buy, or contact the business.</p>
          </div>
        </section>

        <section className="brandSection creatorBusinessSection">
          <span className="kicker">For creators &amp; businesses</span>
          <h2>Build it yourself—or let Cookie Digital Creations build it for you.</h2>
          <p>
            Start with a Free Launch Page, choose a paid builder plan when you need more,
            or use our Done-for-You service for professional setup, wording, design, and customer action buttons.
          </p>
          <div className="twoPathGrid">
            <article>
              <strong>Build It Yourself</strong>
              <p>Choose a template, add your information, watch the live preview, save your draft, and publish when ready.</p>
              <AccountAction className="btn" destination="/builder" guestAllowed mode="create">Start Building Free</AccountAction>
            </article>
            <article>
              <strong>Done for You</strong>
              <p>Have Cookie Digital Creations set up your website while you focus on your business, products, or customers.</p>
              <Link className="btn dark" href="/done-for-you">View Done-for-You Prices</Link>
            </article>
          </div>
        </section>

        <section className="brandSection accountHowItWorks" aria-labelledby="accounts-work-heading">
          <span className="kicker">How accounts work</span>
          <h2 id="accounts-work-heading">Build first. Create an account when you are ready.</h2>
          <p>You can start building without an account. Your draft will be saved temporarily in your current browser. Create a free account when you want to save permanently, use another device, purchase a plan, or publish. Returning customers sign in with their email and password.</p>
          <p className="privacyAccountNote">We use your email to create and protect your account, return you to your saved websites, and connect verified purchases to the correct website. Please review our <Link href="/privacy">Privacy Policy</Link> for complete details.</p>
          <div className="accountHowItWorksActions accountHowItWorksActionsClean">
            <AccountAction className="btn" destination="/customer" mode="create">Create Free Account</AccountAction>
            <CustomerAccountLink placement="account-section" />
          </div>
        </section>

        <section className="aiReadyCommerceSection">
          <div>
            <span className="kicker">AI-ready online selling</span>
            <h2>Clear product information for people and AI-assisted shopping.</h2>
            <p>
              Modern customers may discover businesses through search, social media, or AI shopping assistants.
              Cookie Mini Website Builder helps you publish clear offers, prices, descriptions, FAQs, and action links
              so your products and services are easier to understand and act on.
            </p>
          </div>
          <ul>
            <li>Clear business and product descriptions</li>
            <li>Consistent contact and action information</li>
            <li>Mobile-friendly pages with readable headings</li>
            <li>Book, Order, Buy, Quote, Call, Text, and Email links</li>
          </ul>
        </section>

        <section className="homepageFaqSection" id="frequently-asked-questions">
          <span className="kicker">Frequently asked questions</span>
          <h2>Quick answers before you get started.</h2>
          <div className="homepageFaqGrid">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }} />
        <OwnerFooter />
      </main>
    </>
  );
}
