import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Customer Content & Media Policy | Cookie Mini Website Builder Pro' };

export default function CustomerContentMediaPage() {
  return (
    <LegalPolicyPage
      title="Customer Content & Media Policy"
      subtitle="This policy explains the rules for text, images, videos, links, logos, business claims, galleries, portfolios, menu items, products, and other uploaded or entered website content."
    >
      <PolicySection title="1. Customer ownership and responsibility">
        <p>Customers keep responsibility for the content they add. By uploading or entering content, the customer confirms they have permission to use it on their website and in any related AI video or promotional material.</p>
      </PolicySection>
      <PolicySection title="2. Allowed customer content">
        <PolicyList items={[
          'Business descriptions, services, products, menus, portfolios, galleries, testimonials, pricing, and contact details.',
          'Images, graphics, media links, and videos that the customer owns or is authorized to use.',
          'Promotional wording that is truthful and not misleading.',
          'Business information that can be safely displayed publicly.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Content customers should not upload">
        <PolicyList items={[
          'Content the customer does not own or have permission to use.',
          'Private personal information that should not appear on a public website.',
          'Illegal, hateful, deceptive, exploitative, threatening, harassing, unsafe, or infringing content.',
          'False medical, legal, financial, income, investment, safety, or guaranteed-result claims.',
          'Malware, spam, phishing links, or content designed to trick users.'
        ]} />
      </PolicySection>
      <PolicySection title="4. Media upload limits">
        <p>The builder may compress images, limit file sizes, or recommend media links for larger videos. Customers should use video links when large files may slow the builder, exceed storage limits, or reduce performance.</p>
      </PolicySection>
      <PolicySection title="5. Review and removal">
        <p>Southern Realty Investment Group, LLC may pause, hide, archive, remove, or request changes to customer content that violates these policies, causes technical issues, creates payment risk, or may harm the platform or another person.</p>
      </PolicySection>
      <div style={finePrint}>Customers should double-check all spelling, links, contact details, claims, and media rights before publishing.</div>
    </LegalPolicyPage>
  );
}
