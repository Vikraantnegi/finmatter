'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { motion } from 'framer-motion';
import { Skeleton } from './SectionLoader';

const DashboardHeader = () => {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  const firstName = user?.profileData?.firstName || 'User';
  const fullName = user?.profileData?.lastName
    ? `${firstName} ${user.profileData.lastName}`
    : firstName;
  const avatar = user?.profileData?.avatar;

  if (isLoading) {
    return (
      <div className='px-6 py-4 bg-gradient-to-b from-gray-900/50 to-transparent mb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Skeleton className='w-12 h-12 rounded-full' />
            <Skeleton className='w-40 h-6' />
          </div>
          <Skeleton className='w-10 h-10 rounded-full' />
        </div>
      </div>
    );
  }

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
          <p className='text-lg font-bold text-white'>Hi, {firstName}!</p>
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
};

export default DashboardHeader;
