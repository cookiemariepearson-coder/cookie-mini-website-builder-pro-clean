import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Website Hosting / Pause / Archive Policy | Cookie Mini Website Builder Pro' };

export default function HostingPauseArchivePage() {
  return (
    <LegalPolicyPage
      title="Website Hosting / Pause / Archive Policy"
      subtitle="This policy explains how customer websites may be active, draft, paused, archived, hidden, retrieved, or removed from active management views."
    >
      <PolicySection title="1. Website statuses">
        <PolicyList items={[
          'Draft: saved but not fully published for public use.',
          'Published: active and intended to be available at the customer subdomain.',
          'Paused: temporarily unavailable or limited because of payment, subscription, policy, support, or admin action.',
          'Archived: moved out of the active website list for organization, cancellation, nonpayment, customer request, or cleanup.',
          'Hidden: hidden from the main admin view for organization but not necessarily disabled.'
        ]} />
      </PolicySection>
      <PolicySection title="2. When a site may be paused or archived">
        <PolicyList items={[
          'A paid subscription is canceled, ended, refunded, disputed, reversed, unpaid, or cannot be verified.',
          'A customer asks for the website to be taken down or archived.',
          'The website violates acceptable use, upload, AI video, or content rules.',
          'The website creates technical, storage, safety, legal, or platform risk.',
          'The owner/admin needs to organize inactive, duplicate, abandoned, or test records.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Archive and retrieve">
        <p>Archive is meant to be safer than permanent delete. Archived websites can be reviewed and retrieved by the owner/admin when appropriate. Retrieval does not automatically restore paid plan access if the related subscription is inactive, canceled, refunded, or disputed.</p>
      </PolicySection>
      <PolicySection title="4. Customer access after cancellation">
        <p>If a paid subscription ends, the related website may be paused or archived. The owner/admin may reactivate the website if payment is restored, the customer upgrades, or the issue is resolved.</p>
      </PolicySection>
      <PolicySection title="5. Backups and loss prevention">
        <p>Customers should keep copies of important text, images, videos, and business information. The builder includes draft and dashboard tools, but customers should not treat the platform as their only long-term storage location for important business assets.</p>
      </PolicySection>
      <div style={finePrint}>Archive first. Permanent deletion should be used carefully and only after appropriate review or customer request.</div>
    </LegalPolicyPage>
  );
}
