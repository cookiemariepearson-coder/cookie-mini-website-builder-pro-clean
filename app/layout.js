import './globals.css';
import './owner-footer.css';
import './readability-fix.css';

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
