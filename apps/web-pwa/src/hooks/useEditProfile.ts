import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@finmatter/types';

// Profile form validation schema
const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name is too long'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format'),
  avatar: z.string().optional(),
  pushNotifications: z.boolean().default(true),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

interface UseEditProfileOptions {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
}

export const useEditProfile = (options?: UseEditProfileOptions) => {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with user data
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.profileData?.firstName
        ? `${user.profileData.firstName} ${user.profileData.lastName || ''}`.trim()
        : '',
      phoneNumber: user?.phoneNumber || '',
      avatar: user?.profileData?.avatar || '',
      pushNotifications:
        user?.profileData?.preferences?.notifications?.push?.enabled ?? true,
    },
  });

  const updateProfile = async (data: ProfileFormData) => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      setIsSaving(true);

      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData = {
        firstName,
        lastName,
        phoneNumber: data.phoneNumber,
        avatar: data.avatar || '',
        preferences: {
          notifications: {
            push: {
              enabled: data.pushNotifications,
            },
          },
        },
      };

      const response = await authService.updateProfile(updateData);

      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Profile updated successfully!');
        options?.onSuccess?.(response.data);
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      options?.onError?.(
        error instanceof Error ? error : new Error(errorMessage),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = form.handleSubmit(updateProfile);

  return {
    form,
    isSaving,
    updateProfile,
    handleSubmit,
    user,
  };
};
