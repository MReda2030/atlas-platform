import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AdminRoute } from '@/components/auth/AdminRoute';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminRoute>
  );
}