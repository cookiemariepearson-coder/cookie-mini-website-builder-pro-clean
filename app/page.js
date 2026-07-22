import Link from 'next/link';
import Nav from '../lib/Nav';
import OwnerFooter from '../lib/OwnerFooter';

const plans = [
  ['Free Launch Page', '$0', 'Choose up to 3 sections to launch a simple starter site.'],
  ['Starter Pro', '$19/mo', 'Choose up to 4 sections with image/video upload options.'],
  ['Business', '$30/mo', 'Choose up to 6 sections with media options and AI Video Studio access.'],
  ['Premium', '$50/mo', 'Use all built-in sections with the strongest AI Video Studio access.'],
  ['Extra Page Add-On', '$10/mo per page', 'Add extra page/section space as your website grows.'],
];

export default function Home(){
  return (
    <>
      <Nav />
      <main>
        <section className="heroPage">
          <span className="kicker">Cookie Digital Creations</span>
          <h1>Build a business website in minutes.</h1>
          <p>Choose your sections, add your business details, preview it live, save drafts, then publish to your Cookie Mini Website Builder subdomain.</p>
          <p className="heroButtonRow">
            <Link className="btn" href="/builder">Start Building Free</Link>{' '}
            <Link className="btn dark" href="/pricing">View Website Plans</Link>{' '}
            <Link className="btn light" href="/checkout/ai-video">AI Video Studio — $5</Link>
          </p>
        </section>

        <section className="landingChoiceWrap">
          <div className="landingChoiceCard">
            <span className="kicker">Two ways to create</span>
            <h2>Build a website, create a video, or do both.</h2>
            <p>
              Start with a website plan when you need an online home for your brand. Choose AI Video Studio when you only need a quick promo video workflow for social media.
            </p>
            <div className="landingChoiceGrid">
              <div>
                <h3>Website Builder</h3>
                <p>Create a customer-facing website with the section limit that matches your plan.</p>
                <Link className="btn" href="/builder">Build My Website</Link>
              </div>
              <div>
                <h3>AI Video Studio</h3>
                <p>Create a video kit and access the real AI video workflow as a separate $5 option.</p>
                <Link className="btn dark" href="/checkout/ai-video">Start AI Video — $5</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="planHeroVisualWrap" aria-label="Cookie Mini Website Builder plan previews">
          <div className="planHeroVisualCard cleanPlanHero">
            <div>
              <span className="kicker">Plans that grow with you</span>
              <h2>Start free, then upgrade when your website needs more.</h2>
              <p>
                Pick the plan that matches the amount of website content you need now. You can upgrade later as your business grows.
              </p>
              <div className="frontPlanVisualList">
                {plans.map(([name, price, desc]) => (
                  <div className="frontPlanVisualCard" key={name}>
                    <strong>{name}</strong>
                    <span>{price}</span>
                    <small>{desc}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="landingAiSideCard">
              <span className="kicker">Social video option</span>
              <h3>AI Video Studio — $5</h3>
              <p>For customers who found you through Video Genie or social media and only need help creating a promotional video.</p>
              <Link className="btn" href="/checkout/ai-video">Open AI Video Checkout</Link>
            </div>
          </div>
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
            <h2>AI Video Studio</h2>
            <p>Business and Premium plans include AI Video Studio access. Customers can also choose the separate $5 AI Video option without buying a website plan.</p>
          </div>
        </section>
        <OwnerFooter />
      </main>
    </>
  );
}
