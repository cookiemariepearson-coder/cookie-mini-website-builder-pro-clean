import Link from 'next/link';
export default function Nav(){return <nav className="nav"><div className="logo"><span className="dot">C</span> Cookie Mini Website Builder Pro</div><div><Link href="/builder">Builder</Link><Link href="/pricing">Pricing</Link><Link href="/video-studio">AI Video</Link><Link href="/customer">My Website</Link></div></nav>}
