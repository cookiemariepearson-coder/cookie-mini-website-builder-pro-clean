import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Acceptable Use Policy | Cookie Mini Website Builder Pro' };

export default function AcceptableUsePage() {
  return (
    <LegalPolicyPage
      title="Acceptable Use Policy"
      subtitle="This policy explains what customers may and may not build, publish, upload, link to, or generate through Cookie Mini Website Builder Pro."
    >
      <PolicySection title="1. General rule">
        <p>Customers must use the platform lawfully, honestly, and respectfully. The platform may not be used to mislead visitors, violate rights, distribute harmful content, or create unsafe business risk.</p>
      </PolicySection>
      <PolicySection title="2. Not allowed">
        <PolicyList items={[
          'Illegal goods, services, scams, fraud, phishing, malware, spam, or deceptive offers.',
          "Content that infringes copyrights, trademarks, privacy rights, publicity rights, or another person’s intellectual property.",
          'Hateful, harassing, threatening, exploitative, violent, abusive, or discriminatory content.',
          'Adult sexual content, explicit sexual services, or content involving minors in any unsafe or inappropriate way.',
          'False or unsupported claims about income, investment returns, health outcomes, legal results, safety, approvals, or guaranteed success.',
          "Impersonation, fake endorsements, fake testimonials, fake customer reviews, or unauthorized use of another person’s likeness or brand.",
          'Attempts to bypass plan limits, video credit limits, checkout, access control, admin controls, or platform security.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Review and enforcement">
        <p>Southern Realty Investment Group, LLC may deny, pause, archive, hide, remove, or restrict websites or AI video requests that violate this policy or appear risky. The owner/admin may also correct plan status, disable access, or request edits.</p>
      </PolicySection>
      <PolicySection title="4. Customer disputes">
        <p>If a customer believes a website was paused or archived by mistake, they should contact support with the website name/subdomain, purchase email, and a clear explanation.</p>
      </PolicySection>
      <div style={finePrint}>Keep the platform safe, truthful, and professional so customers can build with confidence.</div>
    </LegalPolicyPage>
  );
}
