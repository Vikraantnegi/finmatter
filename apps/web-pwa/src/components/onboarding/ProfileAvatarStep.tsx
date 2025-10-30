'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { storageService } from '@/services/storageService';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';

interface ProfileAvatarStepProps {
  onNext: (avatar?: string) => void;
  onBack: () => void;
  currentName: string;
}

// Preset avatar options (using emojis as placeholders - can be replaced with actual avatar images)
const PRESET_AVATARS = [
  '👨‍💼',
  '👩‍💼',
  '👨‍🎓',
  '👩‍🎓',
  '👨‍💻',
  '👩‍💻',
  '👨‍🔬',
  '👩‍🔬',
  '🧑‍🚀',
  '👨‍🎨',
  '👩‍🎨',
  '🧑‍🍳',
  '👨‍⚕️',
  '👩‍⚕️',
  '🧑‍🏫',
  '👨‍🌾',
  '👩‍🌾',
  '🧑‍🔧',
  '👨‍🏭',
  '👩‍🏭',
  '🧑‍💼',
  '👨‍✈️',
  '👩‍✈️',
  '🧑‍🚒',
];

export default function ProfileAvatarStep({
  onNext,
  onBack,
  currentName,
}: ProfileAvatarStepProps) {
  const { user } = useAuthStore();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(''); // CDN URL
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    setUploadedImage(''); // Clear uploaded image if preset is selected
    setUploadedImageUrl('');
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

      // Show preview while uploading
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const avatarUrl = await storageService.uploadAvatar(user.id, file);

      if (avatarUrl) {
        setUploadedImageUrl(avatarUrl);
        setSelectedAvatar(''); // Clear preset selection
        toast.success('Avatar uploaded successfully!');
      } else {
        // Clear preview on failure
        setUploadedImage('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setUploadedImage('');
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

  const handleSkip = () => {
    onNext(); // Continue without avatar
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar('');
    setUploadedImage('');
    setUploadedImageUrl('');
  };

  const displayAvatar = uploadedImage || selectedAvatar;

  return (
    <div className='flex items-center justify-center px-4 min-h-[calc(100vh-6rem)]'>
      <div className='max-w-md w-full space-y-8'>
        {/* Back Button */}
        <button
          onClick={onBack}
          className='flex items-center gap-2 text-gray-400 hover:text-white transition-colors'
        >
          <ChevronLeft className='w-5 h-5' />
          <span className='text-sm'>Back</span>
        </button>

        {/* Header */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold text-white'>
            Personalize your profile
          </h1>
          <p className='text-base text-gray-400'>
            Choose an avatar or upload your photo
          </p>
          <p className='text-sm text-gray-500'>
            We&apos;ll use your initials if you skip this step
          </p>
        </div>

        {/* Avatar Preview */}
        <div className='flex justify-center'>
          <div className='relative'>
            <div className='p-1 bg-gradient-to-br from-primary to-blue-400 rounded-full'>
              <div className='bg-background-dark rounded-full p-1'>
                <Avatar
                  name={currentName}
                  avatar={uploadedImageUrl || selectedAvatar}
                  size='2xl'
                  className='w-28 h-28 text-5xl'
                />
              </div>
            </div>
            {(uploadedImageUrl || selectedAvatar) && (
              <button
                onClick={handleRemoveAvatar}
                className='absolute bottom-0 right-0 w-8 h-8 bg-error-500 hover:bg-error-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg'
                disabled={isLoading}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Preview Name */}
        {currentName && (
          <div className='text-center'>
            <p className='text-lg text-white font-medium'>{currentName}</p>
          </div>
        )}

        {/* Upload Options */}
        <div className='space-y-4'>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant='outline'
            disabled={isLoading}
            className='w-full h-14 border-2 border-gray-700 hover:border-primary bg-transparent text-white rounded-xl flex items-center justify-center gap-3 disabled:opacity-50'
          >
            <Upload className='w-5 h-5' />
            <span>{isLoading ? 'Uploading...' : 'Upload Photo'}</span>
          </Button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            className='hidden'
          />
        </div>

        {/* Preset Avatars Grid */}
        <div>
          <p className='text-sm text-gray-400 mb-3'>Or choose an avatar</p>
          <div className='grid grid-cols-6 gap-3 max-h-64 overflow-y-auto rounded-xl bg-gray-800/30 p-4 border border-gray-700'>
            {PRESET_AVATARS.map((avatar, index) => (
              <button
                key={index}
                onClick={() => handleAvatarSelect(avatar)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                  selectedAvatar === avatar
                    ? 'bg-primary scale-110 ring-2 ring-primary'
                    : 'bg-gray-700 hover:bg-gray-600 hover:scale-105'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3 pt-4'>
          <Button
            onClick={handleContinue}
            disabled={!displayAvatar || isLoading}
            className='w-full h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            {isLoading ? 'Uploading...' : 'Continue'}
          </Button>

          <Button
            variant='outline'
            onClick={handleSkip}
            className='w-full h-14 border-2 border-gray-700 hover:border-gray-600 bg-transparent text-gray-300 rounded-xl'
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
