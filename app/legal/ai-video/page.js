import Link from 'next/link';

export const metadata = {
  title: 'AI Video Studio Policy | Cookie Mini Website Builder Pro',
  description: 'AI Video Studio usage policy for Cookie Mini Website Builder Pro.'
};

export default function AiVideoPolicy(){
  return (
    <main className="wrap legalPage">
      <span className="kicker">AI Video Studio Policy</span>
      <h1>AI Video Studio Policy</h1>
      <p>AI Video Studio helps customers create video scripts, captions, prompts, and real AI video workflows when eligible.</p>

      <section className="card">
        <h2>Website plan access</h2>
        <p>Free Launch Page and Starter Pro customers may use creative kit features when available, but real AI video generation is not included with those website plans.</p>
        <p>Business and Premium customers may receive real AI video access based on the monthly limits listed on the current plan page.</p>
      </section>

      <section className="card">
        <h2>Standalone AI Video option</h2>
        <p>Customers who do not need a website plan may purchase a separate AI Video Studio option for the listed checkout price. This option is separate from website subscriptions and does not include website publishing, extra sections, or website plan upgrades.</p>
      </section>

      <section className="card">
        <h2>Customer responsibility</h2>
        <p>Customers are responsible for the business information, wording, images, videos, logos, claims, and instructions they provide for video creation.</p>
      </section>

      <section className="card">
        <h2>No guaranteed results</h2>
        <p>AI Video Studio does not guarantee sales, views, followers, engagement, approvals, income, rankings, or business results.</p>
      </section>

      <p><Link className="btn" href="/legal">Back to Legal Hub</Link></p>
    </main>
  );
}
