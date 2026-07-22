import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  const rootDomain = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cookiesdigitalcreations.com').toLowerCase();

  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/builder') ||
    url.pathname.startsWith('/customer') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/pricing') ||
    url.pathname.startsWith('/checkout') ||
    url.pathname.startsWith('/contact') ||
    url.pathname.startsWith('/legal') ||
    url.pathname.startsWith('/terms') ||
    url.pathname.startsWith('/privacy') ||
    url.pathname.startsWith('/ai-video-policy') ||
    url.pathname.startsWith('/customer-content-media-policy') ||
    url.pathname.startsWith('/video-studio') ||
    url.pathname.startsWith('/site') ||
    PUBLIC_FILE.test(url.pathname)
  ) {
    return NextResponse.next();
  }

  const reserved = new Set(['www','app','admin','builder','dashboard','customer','pricing','checkout','contact','legal','api','video-studio']);

  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, '');
    if (subdomain && !reserved.has(subdomain)) {
      url.pathname = `/site/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  if ((hostname.endsWith('.localhost') || hostname.endsWith('.127.0.0.1')) && hostname.split('.').length > 1) {
    const subdomain = hostname.split('.')[0];
    if (subdomain && !reserved.has(subdomain)) {
      url.pathname = `/site/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
