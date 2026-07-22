import './globals.css';
import './owner-footer.css';
import './readability-fix.css';
import './plan-showcase.css';
import './mobile-responsive-fix.css';
import './pricing-cleanup-fix.css';
import './plan-accuracy-fix.css';

export const metadata = {
  title: 'Cookie Mini Website Builder Pro',
  description: 'Build and publish simple business websites.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
