import Link from 'next/link';
import Nav from '../../../lib/Nav';

export const metadata = { title: 'AI Video Studio Policy | Cookie Mini Website Builder Pro' };

export default function PolicyPage(){
  return (
    <>
      <Nav />
      <main className="wrap legalPage richLegalPage">
        <section className="dashboard">
          <span className="kicker">AI Policy</span>
          <h1>AI Video Studio Policy</h1>
          <p><strong>Last updated:</strong> July 2026</p>
          
          <h2>1. AI Video Studio Overview</h2>
          <p>AI Video Studio helps customers plan video content by creating ideas, hooks, captions, scripts, shot lists, voiceover wording, and video prompts. Some eligible plans may also connect to third-party video generation services such as HeyGen to create real AI-generated videos.</p>

          <h2>2. Standalone AI Video Studio</h2>
          <p>The standalone $5 AI Video Studio option opens the creative planning studio. It is designed for brainstorming, scripting, captions, prompts, and video direction. Real HeyGen video generation is reserved for eligible website plans, owner testing, or other clearly stated paid access.</p>

          <h2>3. HeyGen and Third-Party AI Services</h2>
          <p>When real video generation is available, content may be sent to third-party AI video services for processing, moderation, rendering, storage, and delivery. Those third-party services have their own terms, privacy policies, acceptable use rules, moderation systems, data practices, subscriptions, usage caps, feature limits, output rules, and support processes.</p>

          <h2>4. Plan Limits and Credits</h2>
          <p>Business and Premium plans may include different monthly real video limits. Video credits, limits, processing times, and availability may change based on platform costs, third-party provider rules, usage, technical limits, moderation results, or plan changes.</p>

          <h2>5. Customer Content and Permissions</h2>
          <p>Customers are responsible for all prompts, scripts, images, voices, likenesses, names, business information, offers, claims, and media submitted for AI video use. Customers must have all rights, licenses, consents, and permissions needed for anything they submit or generate.</p>

          <h2>6. Likeness, Voice, Face, and Biometric Considerations</h2>
          <p>Customers may not use another person&apos;s face, voice, name, likeness, identity, image, avatar, performance, or personal information without proper permission. If a third-party AI service collects or processes face geometry, voiceprint, avatar footage, or other biometric-related information, that service&apos;s biometric or privacy notice may apply.</p>

          <h2>7. Synthetic Media Disclosure</h2>
          <p>Customers are responsible for deciding when AI-generated or synthetic media should be disclosed to viewers, customers, platforms, regulators, or the public. Customers should not use AI content in deceptive, misleading, impersonating, fraudulent, or harmful ways.</p>

          <h2>8. Moderation and Refusals</h2>
          <p>AI video requests may be rejected, delayed, moderated, blocked, removed, or fail due to third-party rules, platform policies, content safety systems, copyright concerns, likeness concerns, payment status, technical issues, or usage limits.</p>

          <h2>9. Output Accuracy</h2>
          <p>AI-generated scripts, captions, prompts, videos, scenes, voiceovers, or summaries may be inaccurate, incomplete, similar to outputs generated for others, or not suitable for a customer&apos;s intended use. Customers must review and edit outputs before using them publicly or commercially.</p>

          <h2>10. Prohibited AI Uses</h2>
          <p>AI Video Studio may not be used to create illegal, harmful, deceptive, exploitative, hateful, harassing, adult exploitation, non-consensual intimate, impersonation, political deception, fake endorsement, medical misinformation, financial deception, legal misrepresentation, or rights-infringing content.</p>

          <h2>11. Commercial Use</h2>
          <p>Customers are responsible for confirming that their use of AI outputs, avatars, voices, images, music, logos, and third-party content is allowed for their commercial purpose. Third-party AI services may place limits on free, trial, or paid outputs, and those limits are controlled by the third-party service.</p>

          <h2>12. No Guaranteed Results</h2>
          <p>AI Video Studio does not guarantee views, followers, engagement, conversions, sales, income, approvals, viral performance, video quality, render time, or acceptance by social media platforms.</p>

          <h2>13. Customer Review Required</h2>
          <p>Customers should review scripts, captions, visuals, claims, voiceovers, product wording, prices, contact information, and legal disclaimers before publishing or sharing AI-generated content.</p>

          <h2>14. Changes to AI Features</h2>
          <p>AI tools, third-party providers, pricing, usage limits, model behavior, moderation rules, rendering quality, video length, and availability may change over time.</p>

          <div className="notice">
            <strong>Contact:</strong> Questions about this policy can be sent through <Link href="/contact">Contact Us</Link>.
          </div>
        </section>
      </main>
    </>
  );
}
