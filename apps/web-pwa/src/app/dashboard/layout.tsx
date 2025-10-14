'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useBlockScroll } from '@/hooks/useBlockScroll';
import { Home, CreditCard, LogOut, Menu, X } from 'lucide-react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Block scrolling when sidebar is open on mobile
  useBlockScroll(sidebarOpen);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Cards', href: '/cards', icon: CreditCard },
    // TODO: Uncomment when statements feature is implemented (Week 2-3 as per dev_plan.md)
    // { name: 'Statements', href: '/statements', icon: FileText },
    // TODO: Uncomment when profile page is implemented
    // { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className='flex flex-col h-full'>
          {/* Logo */}
          <div className='flex items-center justify-between h-16 px-6 border-b border-gray-200'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg'></div>
              <span className='text-xl font-bold text-gray-900'>FinMatter</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className='lg:hidden p-2 hover:bg-gray-100 rounded-lg'
            >
              <X className='w-5 h-5 text-gray-600' />
            </button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-6 space-y-1'>
            {navigation.map(item => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <item.icon className='w-5 h-5' />
                  <span className='font-medium'>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className='p-4 border-t border-gray-200'>
            <div className='flex items-center space-x-3 px-4 py-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium'>
                {user?.profileData?.firstName?.charAt(0) || 'U'}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-gray-900 truncate'>
                  {user?.profileData?.firstName || 'User'}
                </div>
                <div className='text-sm text-gray-500 truncate'>
                  {user?.phoneNumber}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className='w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2'
            >
              <LogOut className='w-5 h-5' />
              <span className='font-medium'>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Mobile header */}
        <div className='lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sticky top-0 z-30'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='p-2 hover:bg-gray-100 rounded-lg'
          >
            <Menu className='w-6 h-6 text-gray-600' />
          </button>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg'></div>
            <span className='text-xl font-bold text-gray-900'>FinMatter</span>
          </div>
          <div className='w-10'></div>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={true}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  );
}
