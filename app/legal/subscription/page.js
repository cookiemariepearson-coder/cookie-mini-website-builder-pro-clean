import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Subscription & Cancellation Policy | Cookie Mini Website Builder Pro' };

export default function SubscriptionPage() {
  return (
    <LegalPolicyPage
      title="Subscription & Cancellation Policy"
      subtitle="This policy explains free launch access, paid plans, section limits, media uploads, AI video limits, canceled subscriptions, and website access control."
    >
      <PolicySection title="1. Current plan limits">
        <PolicyList items={[
          'Free Launch Page: up to 3 selected website sections. Image/video uploads and AI Video Studio are not included.',
          'Starter Pro: up to 4 selected website sections plus image/video upload options. AI Video Studio is not included.',
          'Business: up to 6 selected website sections plus image/video upload options and 1 real AI video per month when AI video is active and credits are available.',
          'Premium: access to all built-in website sections plus image/video upload options and 3 real AI videos per month when AI video is active and credits are available.',
          'Extra Page Add-On: optional recurring add-on for extra page/section space when available.'
        ]} />
      </PolicySection>
      <PolicySection title="2. Payment status and access">
        <p>Paid website access is connected to subscription status. If Gumroad or the admin dashboard shows a subscription is canceled, ended, refunded, disputed, failed, or unverified, the website may be paused, archived, or reviewed manually.</p>
      </PolicySection>
      <PolicySection title="3. Cancellations">
        <p>Customers are responsible for canceling their subscription through Gumroad if they no longer want to continue. After cancellation, the website may stay active through the paid period or be paused/archived depending on the subscription event, plan, and admin decision.</p>
      </PolicySection>
      <PolicySection title="4. Manual owner controls">
        <p>The owner/admin may manually correct plans, reactivate, pause, archive, retrieve, hide, or add notes to a website when needed for customer support, payment matching, cancellation review, or platform safety.</p>
      </PolicySection>
      <PolicySection title="5. Extra pages or sections">
        <p>Additional section/page space may require the Extra Page Add-On unless included under the current plan. If the add-on ends or is refunded, extra access may be paused or removed.</p>
      </PolicySection>
      <div style={finePrint}>Keep Gumroad product descriptions, plan cards, images, and this policy consistent with each other so customers understand what they are paying for.</div>
    </LegalPolicyPage>
  );
}
