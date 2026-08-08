'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProfilePage } from '@remat/ui';

export default function DistributorProfileRoute() {
  return (
    <DashboardLayout>
      <div className="py-4">
        <ProfilePage />
      </div>
    </DashboardLayout>
  );
}
