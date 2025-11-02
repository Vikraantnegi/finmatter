'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit3, Camera, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth, useEditProfile, useAvatarUpload } from '@/hooks';

const ProfilePage = () => {
  const router = useRouter();
  const { signOut } = useAuth();

  const { form, isSaving, handleSubmit, user } = useEditProfile();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { isUploading, fileInputRef, handleAvatarClick, handleFileChange } =
    useAvatarUpload(user?.id);

  // Watch form values
  const currentAvatar = watch('avatar');
  const pushNotifications = watch('pushNotifications');

  // Display name for avatar
  const firstName = user?.profileData?.firstName || 'User';
  const lastName = user?.profileData?.lastName || '';
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const onAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event, url => {
      setValue('avatar', url);
    });
  };

  return (
    <div className='min-h-screen bg-background-dark pb-20'>
      {/* Header */}
      <PageHeader
        title='Profile'
        action={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/profile/edit')}
            className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors'
          >
            <Edit3 className='w-4 h-4 text-primary' />
          </motion.button>
        }
      />

      <form onSubmit={handleSubmit} className='px-6 py-6 space-y-8'>
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='flex flex-col items-center'
        >
          <div className='relative'>
            <Avatar name={displayName} avatar={currentAvatar} size='2xl' />
            <motion.button
              type='button'
              whileTap={{ scale: 0.95 }}
              onClick={handleAvatarClick}
              disabled={isUploading}
              className='absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-background-dark shadow-lg disabled:opacity-50'
            >
              {isUploading ? (
                <Loader2 className='w-5 h-5 text-white animate-spin' />
              ) : (
                <Camera className='w-5 h-5 text-white' />
              )}
            </motion.button>
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/jpg,image/png,image/webp'
            onChange={onAvatarChange}
            className='hidden'
          />
          <h2 className='mt-4 text-2xl font-bold text-white'>{displayName}</h2>
          <p className='text-sm text-gray-400'>{user?.phoneNumber}</p>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='space-y-4'
        >
          <h3 className='text-lg font-semibold text-white'>
            Personal Information
          </h3>

          {/* Full Name */}
          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Full Name
            </label>
            <input
              type='text'
              {...register('fullName')}
              className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
              placeholder='Enter your full name'
            />
            {errors.fullName && (
              <p className='mt-1 text-sm text-red-500'>
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Phone Number
            </label>
            <input
              type='tel'
              {...register('phoneNumber')}
              className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
              placeholder='+1 (555) 123-4567'
            />
            {errors.phoneNumber && (
              <p className='mt-1 text-sm text-red-500'>
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='space-y-4'
        >
          <h3 className='text-lg font-semibold text-white'>Preferences</h3>

          {/* Push Notifications */}
          <div className='flex items-center justify-between p-4 bg-gray-800/30 rounded-xl'>
            <span className='text-white'>Push Notifications</span>
            <button
              type='button'
              onClick={() => setValue('pushNotifications', !pushNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                pushNotifications ? 'bg-primary' : 'bg-gray-700'
              }`}
            >
              <motion.div
                animate={{ x: pushNotifications ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className='absolute top-1 w-4 h-4 bg-white rounded-full'
              />
            </button>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='space-y-4 pt-4'
        >
          <Button
            type='submit'
            disabled={isSaving}
            className='w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          <button
            type='button'
            onClick={handleLogout}
            className='w-full text-red-500 hover:text-red-400 font-medium py-3 transition-colors'
          >
            Log Out
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default ProfilePage;
