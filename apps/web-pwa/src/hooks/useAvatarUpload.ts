import { useState, useRef, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { uploadAvatar, validateImageFile } from '@/services/storageService';

export const useAvatarUpload = (userId: string | undefined) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatarFile = async (file: File): Promise<string | null> => {
    if (!userId) {
      toast.error('User ID is required');
      return null;
    }

    try {
      setIsUploading(true);

      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid image file');
        return null;
      }

      const avatarUrl = await uploadAvatar(file, userId);

      if (avatarUrl) {
        toast.success('Avatar uploaded successfully!');
        return avatarUrl;
      } else {
        throw new Error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload avatar',
      );
      return null;
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    onSuccess?: (url: string) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const avatarUrl = await uploadAvatarFile(file);
    if (avatarUrl && onSuccess) {
      onSuccess(avatarUrl);
    }
  };

  return {
    isUploading,
    fileInputRef,
    handleAvatarClick,
    uploadAvatarFile,
    handleFileChange,
  };
};
