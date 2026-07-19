import './globals.css';
import './owner-footer.css';
import './readability-fix.css';
import OwnerFooter from '../lib/OwnerFooter';

export const metadata = {
  title: 'Cookie Mini Website Builder Pro',
  description: 'Build and publish simple business websites.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <OwnerFooter />
      </body>
    </html>
  );
}
