import Link from 'next/link';
import Nav from '../../../lib/Nav';

export const metadata = { title: 'Terms of Service | Cookie Mini Website Builder Pro' };

export default function PolicyPage(){
  return (
    <>
      <Nav />
      <main className="wrap legalPage richLegalPage">
        <section className="dashboard">
          <span className="kicker">Legal</span>
          <h1>Terms of Service</h1>
          <p><strong>Last updated:</strong> July 2026</p>
          
          <h2>1. Overview</h2>
          <p>Cookie Mini Website Builder Pro is a website builder, customer dashboard, AI video planning workspace, and publishing platform operated by Southern Realty Investment Group, LLC. The platform helps customers create simple business websites, choose sections, save drafts, publish customer subdomains, add media, and add customer action buttons for ordering, booking, buying, contacting, requesting quotes, viewing menus, or making payments through outside services.</p>

          <h2>2. Acceptance of Terms</h2>
          <p>By accessing, purchasing, subscribing to, building with, publishing through, or using Cookie Mini Website Builder Pro, you agree to these Terms of Service and the related policies linked from the Legal page. If you do not agree, do not use the platform.</p>

          <h2>3. Plans, Sections, and Access</h2>
          <p>Plans may include different section limits, media options, AI Video Studio access, and customer action button limits. The current launch structure is: Free Launch Page with up to 3 selected sections and 1 customer action button; Starter Pro with up to 4 selected sections, media uploads, and 2 customer action buttons; Business with up to 6 selected sections, media uploads, AI Video Studio access, and 4 customer action buttons; Premium with all built-in sections, media uploads, AI Video Studio access, and 8 customer action buttons. Extra Page Add-On access may add more page or section space.</p>

          <h2>4. Customer Action Buttons</h2>
          <p>The Order / Book / Buy tools allow website owners to add action buttons such as Call Now, Text Us, Email Us, Book Appointment, Order Now, Buy Now, Request Quote, View Menu, Make a Payment, and Custom Link. Website owners are responsible for the accuracy, safety, legality, availability, wording, fulfillment, prices, appointments, products, menus, services, policies, refunds, deliveries, customer communication, and results connected to those links.</p>

          <h2>5. Third-Party Services</h2>
          <p>Customer websites may connect visitors to outside tools such as Gumroad, Square, Stripe, Calendly, Google Forms, Jotform, Cash App, social media pages, menu pages, email, phone, or other services chosen by the website owner. Cookie Mini Website Builder Pro does not own, operate, control, process, guarantee, or provide customer support for those third-party services. Each third-party provider has its own terms, privacy practices, fees, payment rules, account rules, dispute process, delivery process, and refund process.</p>

          <h2>6. Customer Content</h2>
          <p>Website owners are responsible for all content they enter or upload, including business names, website names, text, descriptions, prices, offers, menus, services, product details, images, videos, logos, testimonials, claims, action links, contact details, and any media or files. Website owners must have all rights, permissions, licenses, and consents needed for the content and links they use.</p>

          <h2>7. AI Video Studio and Synthetic Media</h2>
          <p>AI Video Studio may help create scripts, prompts, hooks, captions, shot lists, voiceover text, scene ideas, and, for eligible plans or owner testing, may connect to third-party video generation services such as HeyGen. AI outputs may be inaccurate, incomplete, similar to content generated for others, or subject to moderation and technical limitations. Customers are responsible for reviewing outputs before using them publicly or commercially.</p>

          <h2>8. Likeness, Voice, Consent, and Rights</h2>
          <p>Customers may not upload, submit, generate, or publish content using another person&apos;s name, image, face, voice, likeness, identity, brand, trademark, copyrighted work, private information, or personal data unless they have the legal right and necessary consent to do so. This is especially important when using AI avatars, voice tools, image tools, video tools, testimonials, before-and-after content, customer images, or employee/contractor media.</p>

          <h2>9. Payments, Subscriptions, and Gumroad</h2>
          <p>Paid website plans are subscription-based unless clearly labeled otherwise. Gumroad or another third-party checkout provider may process payments, subscriptions, receipts, cancellations, refunds, taxes, chargebacks, or payment disputes. Payment failure, cancellation, refund, chargeback, dispute, or subscription end may cause the website, dashboard access, media access, add-ons, or AI Video Studio access to be paused, limited, archived, or removed.</p>

          <h2>10. Refunds and Cancellations</h2>
          <p>Because this is a digital platform with immediate access, refunds are limited and may not be available after access has been used, a website has been created, AI video features have been opened, digital materials have been delivered, or a third-party service has processed the transaction. Canceling a subscription stops future billing according to the checkout provider&apos;s rules, but does not automatically refund past charges.</p>

          <h2>11. Website Publishing and Subdomains</h2>
          <p>Current launch websites publish under the Cookie Mini Website Builder subdomain structure, such as customername.cookiesdigitalcreations.com. Custom domain support is not included unless separately offered in writing as a future upgrade or add-on.</p>

          <h2>12. Acceptable Use</h2>
          <p>Customers may not use the platform for illegal, deceptive, abusive, hateful, harassing, exploitative, infringing, unsafe, fraudulent, spam, malware, impersonation, adult exploitation, non-consensual intimate content, unauthorized financial activity, unauthorized health claims, or other content that violates law, platform policies, third-party rights, or public safety standards.</p>

          <h2>13. No Guaranteed Results</h2>
          <p>Cookie Mini Website Builder Pro does not guarantee sales, bookings, traffic, leads, followers, engagement, search rankings, income, approvals, funding, business success, video performance, or social media results. Customers are responsible for their own business operations, customer service, marketing, compliance, and follow-up.</p>

          <h2>14. Platform Changes</h2>
          <p>Features, templates, prices, plan limits, AI video access, action button limits, media features, and third-party integrations may change over time. We may update the platform to improve quality, security, accuracy, legal compliance, or customer experience.</p>

          <h2>15. Suspension, Removal, and Archive</h2>
          <p>We may pause, archive, hide, limit, or remove websites, drafts, accounts, media, or access if payment fails, a subscription ends, a dispute is opened, content appears unsafe or unlawful, a customer violates policies, or continued access creates legal, technical, security, payment, or platform risk.</p>

          <h2>16. Intellectual Property</h2>
          <p>Cookie Mini Website Builder Pro, its design system, platform logic, builder structure, templates, admin tools, code, platform wording, and branding remain owned by their respective owners. Customers retain responsibility for their own submitted business content, subject to the rights needed for the platform to host, display, process, save, publish, transmit, and support that content.</p>

          <h2>17. Disclaimers and Limitations</h2>
          <p>The platform is provided as a digital website-building and content-planning tool. It is not legal, tax, financial, medical, marketing, compliance, business formation, advertising, or professional advice. Use of the platform is at the customer&apos;s own responsibility to the fullest extent allowed by law.</p>

          <h2>18. Changes to These Terms</h2>
          <p>These Terms may be updated as features, plans, legal requirements, third-party tools, and business operations change. Continued use after updates means the customer accepts the updated Terms.</p>

          <div className="notice">
            <strong>Contact:</strong> Questions about this policy can be sent through <Link href="/contact">Contact Us</Link>.
          </div>
        </section>
      </main>
    </>
  );
}
