const BASE_URL = 'https://www.cookiesdigitalcreations.com';

export default function sitemap() {
  const publicPages = [
    '',
    '/pricing',
    '/how-it-works',
    '/done-for-you',
    '/faq',
    '/contact',
    '/legal',
    '/legal/privacy',
    '/legal/terms',
    '/legal/refund',
    '/legal/subscription',
    '/legal/support',
    '/legal/acceptable-use',
    '/legal/customer-content-media',
    '/legal/ai-video',
    '/legal/website-hosting-pause-archive'
  ];

  return publicPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path ? 'monthly' : 'weekly',
    priority: path ? 0.6 : 1
  }));
}
