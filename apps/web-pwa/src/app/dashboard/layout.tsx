'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className='min-h-screen bg-background-dark pb-20'>
      {/* Page content */}
      <main className='max-w-lg mx-auto'>{children}</main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={true}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>;
    </AuthGuard>
  );
};

export default DashboardLayout;
