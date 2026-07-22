import Link from 'next/link';
import Nav from '../../../lib/Nav';

export const metadata = { title: 'Customer Content & Media Policy | Cookie Mini Website Builder Pro' };

export default function CustomerContentMediaPolicy(){
  return (
    <>
      <Nav />
      <main className="wrap legalPage">
        <section className="dashboard">
          <span className="kicker">Legal</span>
          <h1>Customer Content & Media Policy</h1>
          <p>Last updated: July 2026</p>

          <h2>Customer responsibility</h2>
          <p>Website owners are responsible for all wording, images, videos, logos, prices, service descriptions, product claims, business claims, uploaded media, and links placed on their websites.</p>

          <h2>Order, booking, payment, and contact links</h2>
          <p>The Order / Book / Buy section allows website owners to add links for orders, appointments, quotes, payments, menus, forms, calls, texts, emails, and custom actions. The website owner is responsible for making sure those links are accurate, safe, legal, and working properly.</p>

          <h2>Third-party services</h2>
          <p>If a website owner links to an outside checkout, payment tool, booking calendar, form, delivery option, or product page, that third-party service handles its own processing and policies. Cookie Mini Website Builder Pro does not process the website owner&apos;s customer orders, refunds, appointment changes, deliveries, chargebacks, or disputes through those third-party tools.</p>

          <h2>Prohibited content</h2>
          <p>Customers may not use the platform for illegal, deceptive, abusive, harmful, infringing, exploitative, or unsafe content, or for unsupported claims about health, finance, legal outcomes, approvals, income, or guaranteed results.</p>

          <h2>Contact</h2>
          <p>For support, visit <Link href="/contact">Contact Us</Link>.</p>
        </section>
      </main>
    </>
  );
}
