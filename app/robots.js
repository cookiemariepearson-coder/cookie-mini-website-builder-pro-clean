export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/builder/',
        '/checkout/',
        '/customer/',
        '/launch-test/',
        '/my-website/',
        '/owner-launch/',
        '/site/',
        '/video-studio/'
      ]
    },
    sitemap: 'https://www.cookiesdigitalcreations.com/sitemap.xml'
  };
}
