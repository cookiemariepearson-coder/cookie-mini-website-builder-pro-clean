import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Subscription & Cancellation Policy | Cookie Mini Website Builder Pro' };

export default function SubscriptionPage() {
  return (
    <LegalPolicyPage
      title="Subscription & Cancellation Policy"
      subtitle="This policy explains free pages, paid plans, extra pages, AI video limits, canceled subscriptions, and website access control."
    >
      <PolicySection title="1. Free Launch Page">
        <p>The Free Launch Page includes one basic page with limited features. It is meant as a starter page so customers can test the builder and create a simple online presence.</p>
      </PolicySection>
      <PolicySection title="2. Paid plans">
        <PolicyList items={[
          'Starter Pro: paid subscription for starter website access and publishing features.',
          'Business: paid subscription with additional page access and 1 real AI video per month when AI video is enabled.',
          'Premium: paid subscription with broader page/section access and 3 real AI videos per month when AI video is enabled.',
          'Extra Page Add-On: optional recurring add-on for additional pages when a plan needs more page space.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Payment status and access">
        <p>Paid website access is connected to subscription status. If Gumroad or the admin dashboard shows a subscription is canceled, ended, refunded, disputed, failed, or unverified, the website may be paused, archived, or reviewed manually.</p>
      </PolicySection>
      <PolicySection title="4. Cancellations">
        <p>Customers are responsible for canceling their subscription through Gumroad if they no longer want to continue. After cancellation, the website may stay active through the paid period or be paused/archived depending on the subscription event, plan, and admin decision.</p>
      </PolicySection>
      <PolicySection title="5. Manual owner controls">
        <p>The owner/admin may manually correct plans, reactivate, pause, archive, retrieve, hide, or add notes to a website when needed for customer support, payment matching, cancellation review, or platform safety.</p>
      </PolicySection>
      <PolicySection title="6. Extra pages">
        <p>Extra pages require the Extra Page Add-On unless included under the current plan. If the extra page add-on ends or is refunded, extra page access may be paused or removed.</p>
      </PolicySection>
      <div style={finePrint}>Keep Gumroad product descriptions, plan cards, and this policy consistent with each other so customers understand what they are paying for.</div>
    </LegalPolicyPage>
  );
}
