import Link from 'next/link';
import Nav from '../../../lib/Nav';

export const metadata = { title: 'Privacy Policy | Cookie Mini Website Builder Pro' };

export default function PolicyPage(){
  return (
    <>
      <Nav />
      <main className="wrap legalPage richLegalPage">
        <section className="dashboard">
          <span className="kicker">Privacy</span>
          <h1>Privacy Policy</h1>
          <p><strong>Last updated:</strong> July 2026</p>
          
          <h2>1. Overview</h2>
          <p>This Privacy Policy explains how Cookie Mini Website Builder Pro may collect, use, store, share, and protect information when customers use the website builder, customer dashboard, admin tools, checkout routes, AI Video Studio, published websites, and support features.</p>

          <h2>2. Information Customers Provide</h2>
          <p>Customers may provide business names, website names, subdomain choices, names, email addresses, phone numbers, business descriptions, services, products, prices, menus, testimonials, FAQs, locations, hours, images, videos, logos, links, order/booking/payment URLs, and support messages.</p>

          <h2>3. Website Drafts and Published Website Data</h2>
          <p>The platform may store draft and published website content so customers can save work, return later, publish, edit, and display customer websites. This may include selected sections, plan type, template choices, colors, layout settings, customer action buttons, media links, and published website status.</p>

          <h2>4. Payment and Subscription Information</h2>
          <p>Payments may be processed by Gumroad or other third-party checkout providers. Cookie Mini Website Builder Pro may receive limited purchase, subscription, plan, checkout, product, or customer information needed to confirm access, update plan status, provide support, or manage subscriptions. Full payment card details are handled by the third-party payment provider, not by Cookie Mini Website Builder Pro.</p>

          <h2>5. AI Video Studio Data</h2>
          <p>When customers use AI Video Studio, they may provide business names, promotional details, target audience, script prompts, video style preferences, voice style preferences, email, website slug, and related information. Eligible users may submit content to third-party AI video services for processing. Customers should not submit sensitive personal data, private information, or content they do not have permission to use.</p>

          <h2>6. Uploaded Images, Videos, and Media Links</h2>
          <p>Customers are responsible for media they upload or link. Media may be stored, processed, displayed, compressed, cached, transmitted, or published so the platform can provide builder previews, dashboards, published websites, and support.</p>

          <h2>7. Customer Action Links</h2>
          <p>If a website owner adds an order, booking, payment, menu, quote, phone, text, email, or custom link, visitors who click those links may leave the Cookie Mini Website Builder environment and interact with third-party services. Those services have their own privacy policies and data practices.</p>

          <h2>8. Local Storage and Browser Data</h2>
          <p>The platform may use browser local storage to save drafts, remember website names, store temporary builder state, remember AI Video Studio access on a device, or improve the customer experience. Clearing browser data may remove local drafts or access markers on that device.</p>

          <h2>9. How Information Is Used</h2>
          <p>Information may be used to provide the builder, save drafts, publish websites, verify plan access, route checkout success pages, display customer websites, provide AI Video Studio features, communicate support, prevent misuse, improve the platform, comply with legal obligations, and protect the platform and users.</p>

          <h2>10. How Information May Be Shared</h2>
          <p>Information may be shared with service providers and tools needed to operate the platform, such as hosting, database, checkout, email, support, storage, security, analytics, and AI video service providers. Information may also be shared if required by law, to enforce policies, to respond to disputes, to protect rights and safety, or as part of a business transfer.</p>

          <h2>11. Third-Party Providers</h2>
          <p>The platform may rely on third-party services such as Vercel, Supabase, Gumroad, HeyGen, Google services, email tools, and other providers selected for hosting, storage, checkout, analytics, AI video processing, or support. Their own terms and privacy policies apply to their services.</p>

          <h2>12. Security</h2>
          <p>Reasonable technical and organizational steps are used to protect platform information. No online service can guarantee perfect security. Customers should avoid submitting highly sensitive data and should keep their own account, email, payment, and third-party service credentials secure.</p>

          <h2>13. Data Retention</h2>
          <p>Information may be retained while needed to provide services, support customers, maintain records, comply with legal obligations, resolve disputes, prevent abuse, manage subscriptions, or operate the platform. Deleted, paused, archived, or hidden websites may remain in backups or records for a reasonable period.</p>

          <h2>14. Children</h2>
          <p>The platform is intended for business and creator use and is not directed to children. Customers should not submit children&apos;s personal information without appropriate authority and consent.</p>

          <h2>15. International Use</h2>
          <p>Customers may access the platform from different locations. Information may be processed or stored in the United States or other locations where service providers operate. Customers are responsible for ensuring their website content and customer interactions comply with laws that apply to their business and location.</p>

          <h2>16. Privacy Choices</h2>
          <p>Customers may contact support to ask about their website data, request corrections, request deletion where available, or ask questions about privacy. Some information may need to be retained for legal, security, payment, dispute, or operational reasons.</p>

          <h2>17. Changes to This Policy</h2>
          <p>This Privacy Policy may be updated as the platform, third-party providers, features, laws, and business operations change. Continued use after updates means acceptance of the updated policy.</p>

          <div className="notice">
            <strong>Contact:</strong> Questions about this policy can be sent through <Link href="/contact">Contact Us</Link>.
          </div>
        </section>
      </main>
    </>
  );
}
