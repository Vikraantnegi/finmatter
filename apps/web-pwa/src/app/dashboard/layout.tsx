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
    <div className='min-h-screen bg-background-dark flex flex-col'>
      <main className='flex-1 w-full max-w-lg mx-auto pb-24'>{children}</main>
      <BottomNavigation />
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={true}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  );
};

export default DashboardLayout;
