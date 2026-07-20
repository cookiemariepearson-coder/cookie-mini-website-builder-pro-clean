import Link from 'next/link';
import Nav from '../lib/Nav';
import OwnerFooter from '../lib/OwnerFooter';

export default function Home(){
  return (
    <>
      <Nav />
      <main>
        <section className="heroPage">
          <span className="kicker">Cookie Digital Creations</span>
          <h1>Build a business website in minutes.</h1>
          <p>Choose a website type, pick a look, enter your details, preview it live, save drafts, then publish to your own customer subdomain.</p>
          <p>
            <Link className="btn" href="/builder">Start Building Free</Link>{' '}
            <Link className="btn dark" href="/customer-start">Customer Guide</Link>{' '}
            <Link className="btn light" href="/pricing">View Pricing</Link>
          </p>
        </section>

        <section className="planHeroVisualWrap" aria-label="Cookie Mini Website Builder plan previews">
          <div className="planHeroVisualCard">
            <div>
              <span className="kicker">Plans that grow with you</span>
              <h2>Start free, then upgrade when your website needs more.</h2>
              <p>
                Compare plans clearly before checkout. The builder stays clean while the home page and pricing page show polished plan graphics.
              </p>
              <div className="planHeroActions">
                <Link className="btn" href="/pricing">Compare Plans</Link>
                <Link className="btn dark" href="/builder">Build Free Page</Link>
              </div>
              <p className="planFinePrint">
                Current launch websites publish as customername.cookiesdigitalcreations.com. Custom domains are a later Premium/add-on upgrade.
              </p>
            </div>
            <div className="planHeroImageStack">
              <img src="/gumroad-plan-images/business.png" alt="Cookie Mini Website Builder Business plan" />
              <img src="/gumroad-plan-images/starter-pro.png" alt="Cookie Mini Website Builder Starter Pro plan" />
              <img src="/gumroad-plan-images/premium.png" alt="Cookie Mini Website Builder Premium plan" />
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
            <p>Create promo kits and real HeyGen videos. Finished videos can show inside your Cookie Mini Website Builder site.</p>
          </div>
        </section>
        <OwnerFooter />
      </main>
    </>
  );
}
