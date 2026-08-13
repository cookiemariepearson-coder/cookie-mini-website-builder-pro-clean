import AdminSessionBoundary from '../../components/AdminSessionBoundary';
import Nav from '../../lib/Nav';

export const metadata = {
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }) {
  return <>
    <Nav context="owner" />
    <AdminSessionBoundary>{children}</AdminSessionBoundary>
  </>;
}
