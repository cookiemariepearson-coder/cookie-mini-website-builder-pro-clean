import Nav from '../../lib/Nav';
export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers about publishing, website subscriptions, secure customer access, and AI Video Studio.',
  alternates: { canonical: '/faq' }
};

export default function Page(){const faqs=[['Can I publish for free?','Yes, one basic branded launch page is free.'],['How do paid plans work?','Starter, Business, Premium, and extra pages are monthly subscriptions through Gumroad.'],['Can customers edit later?','Yes. Customers sign in securely, then My Websites shows only records owned by their verified account.'],['Does AI Video Studio make real videos?','Yes. A verified $5 one-time standalone purchase includes planning tools and one real AI-generated video. Eligible Business and Premium customers may also generate real videos through the connected provider, subject to plan limits, processing, moderation, and available credits.']];return <><Nav/><main className="wrap dashboard"><h1>FAQ</h1>{faqs.map(f=><div className="card" key={f[0]}><h3>{f[0]}</h3><p>{f[1]}</p></div>)}</main></>}
