import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Refund Policy | Cookie Mini Website Builder Pro' };

export default function RefundPage() {
  return (
    <LegalPolicyPage
      title="Refund Policy"
      subtitle="This policy explains how refunds are handled for digital website builder subscriptions, extra pages, and AI video features."
    >
      <PolicySection title="1. Digital service access">
        <p>Cookie Mini Website Builder Pro is a digital website-building and hosting-style service. Because access begins immediately after purchase or checkout return, refunds may be limited once a plan has been used, a website has been published, a draft has been saved, extra pages have been unlocked, or AI video credits have been used.</p>
      </PolicySection>
      <PolicySection title="2. Subscription cancellations">
        <p>Customers may cancel subscriptions through Gumroad. Canceling a subscription does not automatically mean a refund will be issued. Website access may remain active until the subscription period ends, or it may be paused according to the subscription/access rules.</p>
      </PolicySection>
      <PolicySection title="3. Refund review factors">
        <PolicyList items={[
          'Whether the customer used the builder after purchase.',
          'Whether a website was published or edited under the paid plan.',
          'Whether extra pages were added or unlocked.',
          'Whether real AI video generation was used.',
          'Whether the issue was caused by a platform error, customer mistake, third-party outage, or account/payment issue.'
        ]} />
      </PolicySection>
      <PolicySection title="4. Refund, dispute, or chargeback effects">
        <p>If a payment is refunded, disputed, reversed, charged back, or marked unpaid, the related paid website, plan benefits, extra pages, and AI video access may be paused, archived, or limited.</p>
      </PolicySection>
      <PolicySection title="5. How to request help">
        <p>Customers should contact support with their name, email, website name/subdomain, Gumroad purchase email, and a clear explanation of the issue.</p>
      </PolicySection>
      <div style={finePrint}>Final refund decisions should be consistent with the Gumroad product page, this policy, and the actual status of the customer subscription or service usage.</div>
    </LegalPolicyPage>
  );
}
