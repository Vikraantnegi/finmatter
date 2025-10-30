'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { storageService } from '@/services/storageService';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';

interface ProfileAvatarStepProps {
  onNext: (avatar?: string) => void;
  onBack: () => void;
  firstName: string;
  lastName?: string;
}

// Preset avatar options (3 male, 3 female)
const PRESET_AVATARS = ['👨‍💼', '👨‍🎓', '👨‍💻', '👩‍💼', '👩‍🎓', '👩‍💻'];

export default function ProfileAvatarStep({
  onNext,
  onBack,
  firstName,
  lastName,
}: ProfileAvatarStepProps) {
  const { user } = useAuthStore();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(''); // CDN URL
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    setUploadedImageUrl(''); // Clear uploaded image if preset is selected
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast.error('User not found. Please try again.');
      return;
    }

    // Validate file using storage service
    const validation = storageService.validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsLoading(true);

      // Upload to Supabase Storage
      const avatarUrl = await storageService.uploadAvatar(user.id, file);

      if (avatarUrl) {
        setUploadedImageUrl(avatarUrl);
        setSelectedAvatar(''); // Clear preset selection
        toast.success('Avatar uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setIsLoading(true);
    // Use CDN URL if image was uploaded, otherwise use preset emoji avatar
    const avatar = uploadedImageUrl || selectedAvatar;
    onNext(avatar);
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar('');
    setUploadedImageUrl('');
  };

  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <div className='max-w-lg w-full space-y-6 flex flex-col items-center justify-between h-full pt-24'>
      <div className='flex flex-col items-center justify-center h-full space-y-6'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-white'>Choose your avatar!</h1>
        </div>

        <div className='flex justify-center'>
          <div className='relative'>
            <div className='p-1 bg-gradient-to-br from-primary to-blue-400 rounded-full'>
              <div className='bg-background-dark rounded-full p-1'>
                <Avatar
                  name={fullName}
                  avatar={uploadedImageUrl || selectedAvatar}
                  size='2xl'
                  className='w-24 h-24 text-4xl'
                />
              </div>
            </div>
            {(uploadedImageUrl || selectedAvatar) && (
              <button
                onClick={handleRemoveAvatar}
                className='absolute bottom-0 right-0 w-8 h-8 bg-error-500 hover:bg-error-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg'
                disabled={isLoading}
              >
                <Trash2 className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>

        <div className='flex justify-center'>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className='h-12 px-6 border-2 border-gray-700 hover:border-primary bg-gray-900 text-white rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-colors'
          >
            <Upload className='w-5 h-5' />
            <span className='text-sm font-medium'>
              {isLoading ? 'Uploading...' : 'Upload Photo'}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            className='hidden'
            disabled={isLoading}
          />
        </div>

        <div className='space-y-6'>
          <p className='text-md text-white text-center'>Or choose an avatar</p>
          <div className='flex flex-col items-center gap-3'>
            <div className='flex gap-4'>
              {PRESET_AVATARS.slice(0, 4).map((avatar, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => handleAvatarSelect(avatar)}
                  disabled={isLoading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-gray-800 hover:bg-gray-700 hover:scale-105'
                  } disabled:opacity-50`}
                >
                  {avatar}
                </button>
              ))}
            </div>
            <div className='flex gap-4'>
              {PRESET_AVATARS.slice(4, 6).map((avatar, index) => (
                <button
                  key={index + 4}
                  type='button'
                  onClick={() => handleAvatarSelect(avatar)}
                  disabled={isLoading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-gray-800 hover:bg-gray-700 hover:scale-105'
                  } disabled:opacity-50`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='flex gap-3 py-6 w-full px-4'>
        <Button
          variant='outline'
          onClick={onBack}
          disabled={isLoading}
          className='flex-1 h-14 border-2 border-gray-700 hover:border-gray-600 bg-transparent text-gray-300 font-semibold rounded-xl disabled:opacity-40 transition-all'
        >
          Back
        </Button>

        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className='flex-1 h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
