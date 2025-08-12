import { AdminRoute } from '@/components/auth/AdminRoute';

export default function AdminAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      {children}
    </AdminRoute>
  );
}

export const metadata = {
  title: 'Admin Analytics - Atlas Travel Platform',
  description: 'Advanced analytics and reporting dashboard for administrators',
};