import Link from 'next/link';
import Nav from '../../lib/Nav';

const groups = [
  ['Gumroad setup', ['Free Launch Page product links to /builder', 'Starter Pro is $19/month', 'Business is $30/month', 'Premium is $50/month', 'Extra Page Add-On is $10/month per page', 'All paid products include return link to /checkout/success?paid=1']],
  ['Vercel setup', ['All Gumroad checkout links are in Environment Variables', 'Supabase URL and service role key are in Environment Variables', 'ADMIN_PIN is set', 'cookiesdigitalcreations.com, www, and wildcard are valid']],
  ['Supabase setup', ['websites table exists', 'site JSON column exists', 'draft/published statuses work', 'admin notes/plan columns are migrated', 'test records can be edited from admin']],
  ['Launch habit', ['Test a free site once per week', 'Check Gumroad subscribers weekly', 'Pause unpaid/canceled sites manually for now', 'Keep a note for customer requests inside Admin Notes', 'Use Archive instead of permanent delete unless the customer requests deletion']]
];

export default function OwnerLaunch() {
  return <>
    <Nav />
    <main className="wrap" style={{paddingTop:28}}>
      <section className="heroPage" style={{padding:'42px 26px'}}>
        <span className="kicker">Owner Launch Checklist</span>
        <h1>Cookie’s launch control page</h1>
        <p>This page is for your final owner-side checks before promoting Cookie Mini Website Builder.</p>
        <p><Link className="btn" href="/launch-test">Open Final Test</Link> <Link className="btn dark" href="/admin">Open Admin</Link></p>
      </section>

      <section className="cardGrid" style={{marginTop:22}}>
        {groups.map(([title, items]) => <div className="card" key={title}>
          <h2>{title}</h2>
          <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
        </div>)}
      </section>

      <section className="card" style={{marginTop:22}}>
        <h2>Soft launch recommendation</h2>
        <p>Start with 3 to 5 test customers or friends first. Let them build free pages, then watch where they get stuck. After that, promote the paid subscriptions harder.</p>
      </section>
    </main>
  </>;
}
