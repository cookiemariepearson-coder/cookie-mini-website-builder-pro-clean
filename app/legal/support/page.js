import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'Contact & Support Policy | Cookie Mini Website Builder Pro' };

export default function SupportPolicyPage() {
  return (
    <LegalPolicyPage
      title="Contact & Support Policy"
      subtitle="This policy explains how customers should request help with drafts, publishing, subscriptions, AI video, media uploads, and website access."
    >
      <PolicySection title="1. Before contacting support">
        <PolicyList items={[
          'Try the Customer Dashboard and search by email, website name, or subdomain.',
          'Check the Customer Guide for how to save drafts, continue later, and publish.',
          'Confirm Gumroad purchase email and website name/subdomain match what was entered at checkout.',
          'For large videos, try using a media link instead of uploading a large file directly.'
        ]} />
      </PolicySection>
      <PolicySection title="2. What to include in support messages">
        <PolicyList items={[
          'Customer name and email used in the builder.',
          'Website name or subdomain.',
          'Gumroad purchase email if different.',
          'Plan purchased, if applicable.',
          'A screenshot or short description of the problem.',
          'Whether the issue is with drafts, checkout, publishing, customer dashboard, admin access, media upload, or AI video.'
        ]} />
      </PolicySection>
      <PolicySection title="3. Response expectations">
        <p>Support may include troubleshooting, correcting a website record, adjusting plan status, helping locate drafts, pausing/archiving sites, or explaining subscription access. Support does not guarantee sales, marketing results, search ranking, or third-party platform approval.</p>
      </PolicySection>
      <PolicySection title="4. Owner/admin discretion">
        <p>The owner/admin may organize, hide, archive, retrieve, pause, reactivate, or add notes to website records to keep customer management accurate and safe.</p>
      </PolicySection>
      <div style={finePrint}>For urgent payment questions, customers may also need to check Gumroad receipts, subscription settings, or account email.</div>
    </LegalPolicyPage>
  );
}
