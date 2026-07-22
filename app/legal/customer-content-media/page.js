import Link from 'next/link';
import Nav from '../../../lib/Nav';

export const metadata = { title: 'Customer Content & Media Policy | Cookie Mini Website Builder Pro' };

export default function PolicyPage(){
  return (
    <>
      <Nav />
      <main className="wrap legalPage richLegalPage">
        <section className="dashboard">
          <span className="kicker">Content Policy</span>
          <h1>Customer Content & Media Policy</h1>
          <p><strong>Last updated:</strong> July 2026</p>
          
          <h2>1. Customer Responsibility</h2>
          <p>Website owners are responsible for all content placed on their websites, including text, images, videos, logos, colors, services, prices, claims, testimonials, contact details, menu items, products, and customer action links.</p>

          <h2>2. Order / Book / Buy Links</h2>
          <p>Customer action buttons may link to phone numbers, texts, emails, booking tools, order forms, menus, checkout pages, payment links, quote forms, social media pages, or custom URLs. The website owner is responsible for making sure those buttons are accurate, legal, safe, current, and working.</p>

          <h2>3. Third-Party Transactions</h2>
          <p>Cookie Mini Website Builder Pro does not process the website owner&apos;s customer orders, payments, appointments, deliveries, refunds, disputes, cancellations, form submissions, or customer messages when those actions happen through third-party tools. The website owner and third-party provider are responsible for those interactions.</p>

          <h2>4. Media Rights</h2>
          <p>Customers must have permission to use uploaded images, videos, logos, music, testimonials, screenshots, product photos, customer photos, before-and-after images, brand assets, and other media.</p>

          <h2>5. Accuracy of Business Information</h2>
          <p>Website owners should keep prices, hours, service areas, availability, menus, offers, ordering instructions, booking rules, refund terms, and contact information up to date.</p>

          <h2>6. Restricted Content</h2>
          <p>The platform may restrict or remove content that appears illegal, unsafe, deceptive, rights-infringing, exploitative, abusive, or unsupported by appropriate permissions or disclaimers.</p>

          <h2>7. Customer Service</h2>
          <p>Website owners are responsible for responding to their own customers, fulfilling their own offers, managing their own third-party checkouts, handling their own refunds and complaints, and complying with laws that apply to their business.</p>

          <div className="notice">
            <strong>Contact:</strong> Questions about this policy can be sent through <Link href="/contact">Contact Us</Link>.
          </div>
        </section>
      </main>
    </>
  );
}
