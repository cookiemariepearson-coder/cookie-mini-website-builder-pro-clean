import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Terms of Service | Cookie Mini Website Builder Pro' };

export default function TermsPage() {
  return (
    <LegalPolicyPage
      title="Terms of Service"
      subtitle="These terms explain the rules for using Cookie Mini Website Builder Pro, including free pages, paid subscriptions, websites, customer content, AI Video Studio, and admin access controls."
    >
      <PolicySection title="1. Who operates this service">
        <p>Cookie Mini Website Builder Pro is owned and operated by Southern Realty Investment Group, LLC. The service helps customers create, save, publish, and manage simple business websites and promotional AI video materials.</p>
      </PolicySection>
      <PolicySection title="2. What the service provides">
        <PolicyList items={[
          'A Free Launch Page option for one basic website page.',
          'Paid subscription plans for more pages, stronger templates, editing access, and publishing features.',
          'Customer dashboard access to find drafts and published websites by email, website name, or subdomain.',
          'Admin tools for plan, status, pause, archive, retrieval, notes, and subscription review.',
          'AI Video Studio creative kits and limited real video generation through connected third-party video services when available.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Customer responsibility">
        <p>Customers are responsible for the business names, logos, text, images, videos, URLs, testimonials, claims, products, services, prices, and any other content they enter, upload, or publish. Customers must have the legal right to use all content they add to a website or AI video request.</p>
      </PolicySection>
      <PolicySection title="4. No guaranteed results">
        <p>Cookie Mini Website Builder Pro does not guarantee sales, traffic, search ranking, customer leads, income, business approval, social media reach, or video performance. The service provides website-building and promotional tools only.</p>
      </PolicySection>
      <PolicySection title="5. Subscription access">
        <p>Paid subscriptions keep the related website active, hosted, editable, and connected to the selected plan features. If a paid subscription is canceled, ended, refunded, disputed, reversed, or unpaid, website access may be paused, archived, or limited.</p>
      </PolicySection>
      <PolicySection title="6. AI Video Studio">
        <p>AI Video Studio may create scripts, captions, prompts, shot lists, and real videos through a connected AI video provider. Customers are responsible for the information they submit and for reviewing generated videos before using them publicly.</p>
      </PolicySection>
      <PolicySection title="7. Prohibited uses">
        <p>Customers may not use the platform to create, host, sell, promote, or distribute illegal, infringing, deceptive, harmful, hateful, exploitative, abusive, or unsafe content. Southern Realty Investment Group, LLC may pause, archive, or remove websites that violate these terms or create business, legal, security, payment, or platform risk.</p>
      </PolicySection>
      <PolicySection title="8. Service changes">
        <p>Features, templates, limits, AI video availability, credit amounts, plan names, pricing, and third-party integrations may change over time. Material customer-facing changes should be reflected in the pricing page, policies, or product descriptions when practical.</p>
      </PolicySection>
      <PolicySection title="9. Support and contact">
        <p>Customers should use the Contact or Support options on the site for help with publishing, drafts, account lookup, subscription questions, or website issues.</p>
      </PolicySection>
      <div style={finePrint}>This template is business guidance for your site and is not a substitute for advice from an attorney. Have a qualified professional review these policies before large-scale public launch.</div>
    </LegalPolicyPage>
  );
}
