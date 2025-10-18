'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useBlockScroll } from '@/hooks/useBlockScroll';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  BarChart3,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Cards', href: '/cards', icon: CreditCard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Block scrolling when sidebar is open on mobile
  useBlockScroll(sidebarOpen);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      // Error handled by toast
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden',
        )}
      >
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-75'
          onClick={() => setSidebarOpen(false)}
        />
        <div className='fixed inset-y-0 left-0 flex w-64 flex-col bg-white'>
          <div className='flex h-16 items-center justify-between px-4'>
            <h1 className='text-xl font-bold text-gray-900'>FinMatter</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className='text-gray-400 hover:text-gray-600'
            >
              <X className='h-6 w-6' />
            </button>
          </div>
          <nav className='flex-1 space-y-1 px-2 py-4'>
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <item.icon className='mr-3 h-5 w-5' />
                  {item.name}
                </button>
              );
            })}
          </nav>
          <div className='border-t border-gray-200 p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center'>
                  <span className='text-sm font-medium text-white'>
                    {user?.profileData?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className='ml-3 flex-1'>
                <p className='text-sm font-medium text-gray-700'>
                  {user?.profileData?.firstName} {user?.profileData?.lastName}
                </p>
                <p className='text-xs text-gray-500'>{user?.phoneNumber}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className='mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900'
            >
              <LogOut className='mr-3 h-5 w-5' />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col'>
        <div className='flex flex-col flex-grow bg-white border-r border-gray-200'>
          <div className='flex h-16 items-center px-4'>
            <h1 className='text-xl font-bold text-gray-900'>FinMatter</h1>
          </div>
          <nav className='flex-1 space-y-1 px-2 py-4'>
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    'w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <item.icon className='mr-3 h-5 w-5' />
                  {item.name}
                </button>
              );
            })}
          </nav>
          <div className='border-t border-gray-200 p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center'>
                  <span className='text-sm font-medium text-white'>
                    {user?.profileData?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className='ml-3 flex-1'>
                <p className='text-sm font-medium text-gray-700'>
                  {user?.profileData?.firstName} {user?.profileData?.lastName}
                </p>
                <p className='text-xs text-gray-500'>{user?.phoneNumber}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className='mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900'
            >
              <LogOut className='mr-3 h-5 w-5' />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Mobile header */}
        <div className='sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden'>
          <button
            type='button'
            className='-m-2.5 p-2.5 text-gray-700 lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </button>
          <div className='h-6 w-px bg-gray-200 lg:hidden' />
          <h1 className='text-lg font-semibold text-gray-900'>FinMatter</h1>
        </div>

        {/* Page content */}
        <main className='py-6'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
