/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 */

import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export class StorageService {
  private readonly AVATARS_BUCKET = 'avatars';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'image/gif',
  ];

  /**
   * Upload user avatar
   * @param userId - User ID
   * @param file - Image file to upload
   * @returns Public URL of uploaded avatar or null if failed
   */
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          'Please upload a valid image file (JPEG, PNG, WebP, or GIF)',
        );
        return null;
      }

      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        toast.error('Image size should be less than 5MB');
        return null;
      }

      // Generate unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      await this.deleteUserAvatars(userId);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.AVATARS_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Avatar upload error:', error);
        toast.error('Failed to upload avatar. Please try again.');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.AVATARS_BUCKET)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Unexpected error during avatar upload:', error);
      toast.error('Something went wrong. Please try again.');
      return null;
    }
  }

  /**
   * Delete user's avatar(s)
   * @param userId - User ID
   */
  async deleteUserAvatars(userId: string): Promise<void> {
    try {
      // List all files in user's folder
      const { data: files, error: listError } = await supabase.storage
        .from(this.AVATARS_BUCKET)
        .list(userId);

      if (listError || !files || files.length === 0) {
        return; // No files to delete or error listing
      }

      // Delete all files
      const filesToDelete = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(this.AVATARS_BUCKET)
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting old avatars:', deleteError);
      }
    } catch (error) {
      console.error('Error in deleteUserAvatars:', error);
      // Don't throw - this is cleanup, not critical
    }
  }

  /**
   * Get avatar URL for a user
   * @param avatarPath - Path to avatar in storage
   * @returns Public URL or null
   */
  getAvatarUrl(avatarPath: string): string | null {
    if (!avatarPath) return null;

    try {
      const { data } = supabase.storage
        .from(this.AVATARS_BUCKET)
        .getPublicUrl(avatarPath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }

  /**
   * Validate if file is a valid image
   * @param file - File to validate
   * @returns true if valid, false otherwise
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)',
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Image size should be less than 5MB',
      };
    }

    return { valid: true };
  }
}

export const storageService = new StorageService();
