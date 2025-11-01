'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit3, Camera, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar, validateImageFile } from '@/services/storageService';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(
    user?.profileData?.firstName
      ? `${user.profileData.firstName} ${user.profileData.lastName || ''}`
      : '',
  );
  const [email, setEmail] = useState(''); // TODO: Add email field to user type
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [pushNotifications, setPushNotifications] = useState(
    user?.profileData?.preferences?.notifications?.push?.enabled ?? true,
  );
  const [emailNewsletter, setEmailNewsletter] = useState(
    user?.profileData?.preferences?.notifications?.email?.enabled ?? false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(
    user?.profileData?.avatar || '',
  );

  const firstName = user?.profileData?.firstName || 'User';
  const lastName = user?.profileData?.lastName || '';
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Split full name into first and last
      const nameParts = fullName.trim().split(' ');
      const newFirstName = nameParts[0] || '';
      const newLastName = nameParts.slice(1).join(' ') || '';

      // Prepare update data
      const updateData = {
        firstName: newFirstName,
        lastName: newLastName,
        phoneNumber: phone,
        avatar: currentAvatar,
        preferences: {
          notifications: {
            push: {
              enabled: pushNotifications,
            },
            email: {
              enabled: emailNewsletter,
            },
          },
        },
      };

      // Call API to update profile
      const response = await authService.updateProfile(updateData);

      if (response.success && response.data) {
        // Update local state
        setUser(response.data);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingAvatar(true);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid image file');
        return;
      }

      // Upload to Supabase Storage
      const avatarUrl = await uploadAvatar(file, user.id);

      if (avatarUrl) {
        // Update avatar in state
        setCurrentAvatar(avatarUrl);
        toast.success('Avatar uploaded successfully!');
      } else {
        throw new Error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload avatar',
      );
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

      <div className='px-6 py-6 space-y-8'>
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
              whileTap={{ scale: 0.95 }}
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className='absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-background-dark shadow-lg disabled:opacity-50'
            >
              {isUploadingAvatar ? (
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
            onChange={handleFileChange}
            className='hidden'
          />
          <h2 className='mt-4 text-2xl font-bold text-white'>{displayName}</h2>
          <p className='text-sm text-gray-400'>{phone}</p>
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
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
              placeholder='Enter your full name'
            />
          </div>

          {/* Email */}
          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Email Address
            </label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
              placeholder='Enter your email'
            />
          </div>

          {/* Phone */}
          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Phone Number
            </label>
            <input
              type='tel'
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
              placeholder='+1 (555) 123-4567'
            />
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
              onClick={() => setPushNotifications(!pushNotifications)}
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

          {/* Email Newsletter */}
          <div className='flex items-center justify-between p-4 bg-gray-800/30 rounded-xl'>
            <span className='text-white'>Email Newsletter</span>
            <button
              onClick={() => setEmailNewsletter(!emailNewsletter)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emailNewsletter ? 'bg-primary' : 'bg-gray-700'
              }`}
            >
              <motion.div
                animate={{ x: emailNewsletter ? 24 : 2 }}
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
            onClick={handleSave}
            disabled={isSaving}
            className='w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          <button
            onClick={handleLogout}
            className='w-full text-red-500 hover:text-red-400 font-medium py-3 transition-colors'
          >
            Log Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
