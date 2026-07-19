import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Privacy Policy | Cookie Mini Website Builder Pro' };

export default function PrivacyPage() {
  return (
    <LegalPolicyPage
      title="Privacy Policy"
      subtitle="This policy explains what information may be collected when customers build websites, save drafts, publish pages, use subscriptions, or generate AI video content."
    >
      <PolicySection title="1. Information we may collect">
        <PolicyList items={[
          'Customer email address used to find drafts, published websites, and subscription records.',
          'Website name, subdomain, business name, contact details, page wording, template choices, design settings, media links, and uploaded images or files.',
          'Draft and published website data saved through the website builder.',
          'Plan, status, access, subscription, payment event, cancellation, refund, dispute, and admin note data connected to Gumroad and Supabase records.',
          'AI Video Studio form details, scripts, prompts, captions, video generation status, and generated video links when real video generation is used.'
        ]} />
      </PolicySection>
      <PolicySection title="2. How information is used">
        <PolicyList items={[
          'To save drafts and publish websites.',
          'To help customers return to their saved drafts or published sites.',
          'To provide customer and admin dashboard features.',
          'To connect paid subscriptions, plan limits, website access, extra pages, and AI video credits.',
          'To provide support, troubleshoot errors, prevent abuse, and improve the platform.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Third-party services">
        <p>The platform may use third-party services such as Vercel for hosting, Supabase for database and storage-related functionality, Gumroad for checkout and subscription events, and HeyGen or another video provider for AI video generation. Those services may process information as needed to provide their features.</p>
      </PolicySection>
      <PolicySection title="4. Customer content visibility">
        <p>Drafts are intended to stay private until published. Published websites are public and may be visible on customer subdomains. Customers should not publish private, sensitive, confidential, or restricted information unless they are authorized to do so.</p>
      </PolicySection>
      <PolicySection title="5. Data retention and deletion requests">
        <p>Website records may be kept while a website is active, paused, archived, needed for support, or connected to payment/account records. Customers may request that a website be archived, deactivated, or removed. Some basic payment, dispute, tax, business, or audit records may need to be kept when appropriate.</p>
      </PolicySection>
      <PolicySection title="6. Security">
        <p>Reasonable steps are used to keep admin tools, API keys, and customer records protected. Customers should use accurate contact information and avoid uploading sensitive data that is not needed for their public website.</p>
      </PolicySection>
      <PolicySection title="7. Privacy promises">
        <p>The business should keep this privacy policy aligned with what the platform actually collects, uses, stores, and shares. If new tools or integrations are added, this policy should be updated.</p>
      </PolicySection>
      <div style={finePrint}>Policy note: Do not collect more customer information than you need to run the builder, support customers, process subscriptions, and provide selected AI video features.</div>
    </LegalPolicyPage>
  );
}
