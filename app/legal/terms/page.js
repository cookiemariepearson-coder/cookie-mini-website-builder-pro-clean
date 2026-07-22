import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Terms of Service | Cookie Mini Website Builder Pro' };

export default function TermsPage() {
  return (
    <LegalPolicyPage
      title="Terms of Service"
      subtitle="These terms explain the rules for using Cookie Mini Website Builder Pro, including free launch pages, paid subscriptions, selected website sections, customer content, AI Video Studio, and admin access controls."
    >
      <PolicySection title="1. Who operates this service">
        <p>Cookie Mini Website Builder Pro is owned and operated by Southern Realty Investment Group, LLC. The service helps customers create, save, publish, and manage simple business websites and promotional AI video materials.</p>
      </PolicySection>
      <PolicySection title="2. Current plan structure">
        <PolicyList items={[
          'Free Launch Page: up to 3 selected website sections.',
          'Starter Pro: up to 4 selected website sections plus image/video upload options.',
          'Business: up to 6 selected website sections plus image/video upload options and AI Video Studio access.',
          'Premium: access to all built-in website sections plus image/video upload options and AI Video Studio access.',
          'Extra Page Add-On: optional recurring add-on for extra page/section space when available.'
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
        <p>AI Video Studio is currently available to Business and Premium plan customers, subject to plan limits, third-party provider availability, platform settings, and available credits. Lower plans may see AI Video Studio advertising or upgrade messages but may not be able to open or use the studio until upgraded.</p>
      </PolicySection>
      <PolicySection title="7. Prohibited uses">
        <p>Customers may not use the platform to create, host, sell, promote, or distribute illegal, infringing, deceptive, harmful, hateful, exploitative, abusive, or unsafe content. Southern Realty Investment Group, LLC may pause, archive, or remove websites that violate these terms or create business, legal, security, payment, or platform risk.</p>
      </PolicySection>
      <PolicySection title="8. Service changes">
        <p>Features, templates, limits, AI video availability, credit amounts, plan names, pricing, and third-party integrations may change over time. Material customer-facing changes should be reflected in the pricing page, policies, or product descriptions when practical.</p>
      </PolicySection>
      <div style={finePrint}>This template is business guidance for your site and is not a substitute for advice from a qualified legal professional.</div>
    </LegalPolicyPage>
  );
}
