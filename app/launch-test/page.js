import Link from 'next/link';

const checks = [
  ['Free Launch Page', 'Build one free site, publish it, open the customer subdomain, and confirm only Home is public.'],
  ['Starter checkout', 'Choose Starter Pro, click checkout, confirm Gumroad opens, return to checkout success, and publish.'],
  ['Business checkout', 'Choose Business, confirm up to 3 pages work, then test extra page add-on when adding a 4th page.'],
  ['Premium plan', 'Choose Premium, confirm all built-in pages can be selected without extra-page checkout.'],
  ['Draft saving', 'Save two different drafts, go to My Website, search by email, and confirm both drafts show in one list.'],
  ['Template switching', 'Switch website type and design look, then confirm the preview changes layout, artwork, colors, and card style.'],
  ['Media upload', 'Upload a hero image, add one gallery image, add one video/social link, then save draft and reopen.'],
  ['Customer dashboard', 'Open /customer, search by email or short website name, continue a draft, and edit a published site.'],
  ['Admin dashboard', 'Open /admin, enter PIN, check Websites, Plans & Status, Admin Notes, and pause/archive controls.'],
  ['AI Video Studio', 'Open Video Studio from the builder, generate a kit, download the kit, and return back to the same draft.']
];

export default function LaunchTestPage(){
  return <main className="wrap dashboard launchTestPage">
    <span className="kicker">Final Launch Testing</span>
    <h1>Cookie Mini Website Builder Launch Checklist</h1>
    <p>Use this page before promoting the builder. Test each item once on desktop and once on mobile if possible.</p>
    <div className="quickLinks">
      <Link className="btn" href="/builder">Open Builder</Link>
      <Link className="btn dark" href="/customer">Customer Dashboard</Link>
      <Link className="btn dark" href="/admin">Admin</Link>
      <Link className="btn dark" href="/video-studio">AI Video Studio</Link>
      <Link className="btn dark" href="/pricing">Pricing</Link>
    </div>
    <div className="launchGrid">
      {checks.map(([title, text], index) => <section className="launchCard" key={title}>
        <strong>{index + 1}</strong>
        <h2>{title}</h2>
        <p>{text}</p>
      </section>)}
    </div>
    <div className="notice">
      <strong>Ready to launch when:</strong> Free, paid checkout, Gumroad return, Supabase save, customer subdomain, customer dashboard, admin dashboard, and AI Video Studio all pass this checklist.
    </div>
  </main>;
}
