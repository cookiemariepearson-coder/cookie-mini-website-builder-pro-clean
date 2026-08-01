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
import CookieAiAssistant from '../components/CookieAiAssistant';

export const metadata = {
  title: 'Cookie Mini Website Builder Pro',
  description: 'Build, publish, and grow simple business websites.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="impact-site-verification" value="6a804b9b-3376-4cc7-8b0f-9c6d95497d97" />
      </head>
      <body>
        {children}
        <CookieAiAssistant />
      </body>
    </html>
  );
}
