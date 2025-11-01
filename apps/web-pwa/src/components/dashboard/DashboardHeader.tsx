'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { motion } from 'framer-motion';

/**
 * Get simple greeting
 */
function getGreeting(): string {
  return 'Hi';
}

export function DashboardHeader() {
  const router = useRouter();
  const { user } = useAuthStore();

  const firstName = user?.profileData?.firstName || 'User';
  const fullName = user?.profileData?.lastName
    ? `${firstName} ${user.profileData.lastName}`
    : firstName;
  const avatar = user?.profileData?.avatar;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='flex items-center justify-between px-6 py-4 bg-gradient-to-b from-gray-900/50 to-transparent'
    >
      {/* Avatar + Greeting */}
      <button
        onClick={() => router.push('/profile')}
        className='flex items-center gap-3 group'
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Avatar
            name={fullName}
            avatar={avatar}
            size='lg'
            className='ring-2 ring-gray-800 group-hover:ring-primary/50 transition-all duration-200'
          />
        </motion.div>

        <div className='text-left'>
          <p className='text-lg font-bold text-white'>
            {getGreeting()}, {firstName}!
          </p>
        </div>
      </button>

      {/* Settings Icon */}
      <motion.button
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={() => router.push('/settings')}
        className='p-2.5 rounded-full bg-gray-800/50 hover:bg-gray-800 transition-colors'
      >
        <Settings className='w-6 h-6 text-gray-400' />
      </motion.button>
    </motion.div>
  );
}
