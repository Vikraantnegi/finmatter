'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, CreditCard, PieChart, TrendingUp, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home, label: 'Dashboard' },
  { name: 'Cards', href: '/cards', icon: CreditCard, label: 'Cards' },
  {
    name: 'Spending',
    href: '/spending',
    icon: PieChart,
    label: 'Spendings',
  },
  { name: 'Insights', href: '/analytics', icon: TrendingUp, label: 'Insights' },
  { name: 'Finny', href: '/finny', icon: Bot, label: 'Finny' },
];

export const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 bg-background-dark border-t border-gray-800'>
      <div className='max-w-lg mx-auto px-6 py-3'>
        <div className='flex items-center justify-between'>
          {navItems.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className='relative flex flex-col items-center gap-1 min-w-[60px] py-2'
              >
                <motion.div
                  className='relative'
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 17,
                  }}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-gray-500',
                    )}
                  />
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-gray-500',
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area for iOS */}
      <div className='h-safe-area-inset-bottom bg-background-dark' />
    </nav>
  );
};
