import Link from 'next/link';
import Nav from '../../../lib/Nav';

export const metadata = { title: 'Terms of Service | Cookie Mini Website Builder Pro' };

export default function TermsPage(){
  return (
    <>
      <Nav />
      <main className="wrap legalPage">
        <section className="dashboard">
          <span className="kicker">Legal</span>
          <h1>Terms of Service</h1>
          <p>Last updated: July 2026</p>

          <h2>Platform use</h2>
          <p>Cookie Mini Website Builder Pro helps customers build simple business websites, save drafts, publish customer subdomains, and add customer action buttons such as call, text, email, order, booking, payment, menu, quote, or custom links.</p>

          <h2>Customer content and links</h2>
          <p>Customers are responsible for the text, images, videos, logos, business information, prices, offers, claims, and third-party links they add to their websites. This includes links to order forms, payment pages, booking tools, menus, digital products, social media pages, and other outside services.</p>

          <h2>Third-party checkout, booking, and payment services</h2>
          <p>Customer websites may link to outside services such as Gumroad, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, social media, email, phone, or other services chosen by the website owner. Cookie Mini Website Builder Pro does not control those third-party services and is not responsible for their checkout, refunds, orders, appointment handling, delivery, customer communication, account access, outages, or policies.</p>

          <h2>Subscriptions and access</h2>
          <p>Paid website plans are subscription-based. If a payment is canceled, refunded, disputed, or fails, website access may be limited, paused, or archived. Extra pages or added space may require an add-on.</p>

          <h2>No guaranteed results</h2>
          <p>Cookie Mini Website Builder Pro does not guarantee sales, traffic, customers, search rankings, video performance, social media results, income, approvals, or business outcomes.</p>

          <h2>Contact</h2>
          <p>For support, visit <Link href="/contact">Contact Us</Link>.</p>
        </section>
      </main>
    </>
  );
}
