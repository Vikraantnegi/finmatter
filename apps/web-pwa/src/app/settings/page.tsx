'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronRight,
  Bell,
  Mail,
  HelpCircle,
  FileText,
  Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const firstName = user?.profileData?.firstName || 'User';
  const lastName = user?.profileData?.lastName || '';
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;
  const phone = user?.phoneNumber || '';
  const avatar = user?.profileData?.avatar;

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement delete account flow
    console.log('Delete account');
  };

  return (
    <div className='min-h-screen bg-background-dark pb-20'>
      {/* Header */}
      <PageHeader title='Settings' />

      <div className='px-6 py-6 space-y-6'>
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='relative'
        >
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500' />
          <input
            type='text'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search settings'
            className='w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
          />
        </motion.div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl'
        >
          <div className='flex items-center gap-3'>
            <Avatar name={displayName} avatar={avatar} size='lg' />
            <div>
              <p className='font-semibold text-white'>{displayName}</p>
              <p className='text-sm text-gray-400'>{phone}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className='px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors'
          >
            Edit Profile
          </button>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='space-y-3'
        >
          <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider px-2'>
            Notifications
          </h3>

          {/* Push Notifications */}
          <button
            onClick={() => router.push('/settings/notifications/push')}
            className='w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors'>
                <Bell className='w-5 h-5 text-gray-400' />
              </div>
              <span className='text-white font-medium'>Push Notifications</span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-500' />
          </button>

          {/* Email Notifications */}
          <button
            onClick={() => router.push('/settings/notifications/email')}
            className='w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors'>
                <Mail className='w-5 h-5 text-gray-400' />
              </div>
              <span className='text-white font-medium'>
                Email Notifications
              </span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-500' />
          </button>
        </motion.div>

        {/* Support & Legal Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='space-y-3'
        >
          <h3 className='text-sm font-semibold text-gray-400 uppercase tracking-wider px-2'>
            Support & Legal
          </h3>

          {/* Help Center */}
          <button
            onClick={() => router.push('/help')}
            className='w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors'>
                <HelpCircle className='w-5 h-5 text-gray-400' />
              </div>
              <span className='text-white font-medium'>Help Center</span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-500' />
          </button>

          {/* Terms of Service */}
          <button
            onClick={() => router.push('/terms')}
            className='w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors'>
                <FileText className='w-5 h-5 text-gray-400' />
              </div>
              <span className='text-white font-medium'>Terms of Service</span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-500' />
          </button>

          {/* Privacy Policy */}
          <button
            onClick={() => router.push('/privacy')}
            className='w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors'>
                <Shield className='w-5 h-5 text-gray-400' />
              </div>
              <span className='text-white font-medium'>Privacy Policy</span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-500' />
          </button>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='space-y-4 pt-6'
        >
          <Button
            onClick={handleLogout}
            className='w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors'
          >
            Log Out
          </Button>

          <button
            onClick={handleDeleteAccount}
            className='w-full text-red-500 hover:text-red-400 font-medium py-3 transition-colors'
          >
            Delete Account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
