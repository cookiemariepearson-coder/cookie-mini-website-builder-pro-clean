import { LegalPolicyPage, PolicySection, PolicyList, finePrint } from '../../../lib/LegalPolicyPage';

export const metadata = { title: 'AI Video Studio Policy | Cookie Mini Website Builder Pro' };

export default function AiVideoPolicyPage() {
  return (
    <LegalPolicyPage
      title="AI Video Studio Policy"
      subtitle="This policy explains real AI video generation, HeyGen access, plan limits, and customer responsibility for generated content."
    >
      <PolicySection title="1. Current AI Video Studio access">
        <PolicyList items={[
          'Free Launch Page: AI Video Studio is not included. Customers may see an upgrade message.',
          'Starter Pro: AI Video Studio is not included. Customers may see an upgrade message.',
          'Business: 1 real AI video per month when the feature is active and credits are available.',
          'Premium: 3 real AI videos per month when the feature is active and credits are available.',
          'Owner/Admin: testing override may be available through a private access code.'
        ]} />
      </PolicySection>
      <PolicySection title="2. Real AI video generation">
        <p>When enabled, real video generation may be powered by HeyGen or another AI video provider. Availability depends on third-party API access, credits, service availability, plan limits, and platform settings.</p>
      </PolicySection>
      <PolicySection title="3. Customer responsibility">
        <p>Customers are responsible for the names, descriptions, claims, images, prompts, products, services, voices, likenesses, logos, and other content they submit. Customers must review AI-generated content before posting, selling, sharing, or using it in advertising.</p>
      </PolicySection>
      <PolicySection title="4. Prohibited AI video requests">
        <p>Customers may not request videos that are illegal, deceptive, hateful, abusive, infringing, exploitative, unsafe, sexually explicit, impersonating someone without permission, or violating the rights of another person or business.</p>
      </PolicySection>
      <PolicySection title="5. Credits and failures">
        <p>AI video generation may use paid provider credits. If a third-party provider charges for a video request, failed, delayed, or rejected generations may still be subject to the provider's usage rules. The platform may limit, pause, or disable real generation to protect the owner account from unexpected costs.</p>
      </PolicySection>
      <PolicySection title="6. No guarantee of performance">
        <p>AI videos are promotional tools. The platform does not guarantee social media views, sales, ranking, audience growth, ad approval, copyright clearance, or business results.</p>
      </PolicySection>
      <div style={finePrint}>Do not share private access codes or API keys. Customer-facing video access should stay limited by plan and usage controls.</div>
    </LegalPolicyPage>
  );
}
