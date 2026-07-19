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
            <p>Create promo scripts, captions, shot lists, voiceover text, and AI video prompts. Real HeyGen video connection comes next.</p>
          </div>
        </section>
        <OwnerFooter />
      </main>
    </>
  );
}
