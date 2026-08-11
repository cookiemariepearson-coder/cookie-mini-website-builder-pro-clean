import './globals.css';
import './owner-footer.css';
import './readability-fix.css';
import './plan-showcase.css';
import './mobile-responsive-fix.css';
import './pricing-cleanup-fix.css';
import './plan-accuracy-fix.css';
import './clean-pricing-ai-video-fix.css';
import './customer-action-brand-refresh.css';
import './customer-site-templates-rebuild.css';
import './cookie-ai-assistant.css';
import './done-for-you.css';
import './website-experience-refresh.css';
import './admin-warm-refresh.css';
import './account-modal.css';
import CookieAiAssistant from '../components/CookieAiAssistant';
import AccountModalProvider from '../components/AccountModalProvider';

export const metadata = {
  metadataBase: new URL('https://www.cookiesdigitalcreations.com'),
  title: {
    default: 'Cookie Mini Website Builder Pro',
    template: '%s | Cookie Mini Website Builder Pro'
  },
  description: 'Build, publish, and grow simple business websites.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Cookie Mini Website Builder Pro',
    title: 'Cookie Mini Website Builder Pro',
    description: 'Build, publish, and grow simple business websites.'
  },
  twitter: {
    card: 'summary',
    title: 'Cookie Mini Website Builder Pro',
    description: 'Build, publish, and grow simple business websites.'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="impact-site-verification" content="6a804b9b-3376-4cc7-8b0f-9c6d95497d97" />
      </head>
      <body>
        <AccountModalProvider>
          {children}
          <CookieAiAssistant />
        </AccountModalProvider>
      </body>
    </html>
  );
}
