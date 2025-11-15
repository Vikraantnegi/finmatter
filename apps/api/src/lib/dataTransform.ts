/**
 * Data Transformation Utilities
 * Handles conversion between database format (snake_case) and API format (camelCase)
 */

/**
 * Convert database user (snake_case) to API user (camelCase)
 * Ensures consistent user data transformation across all API responses
 */
export function dbUserToApiUser(dbUser: any) {
  const profileData = {
    firstName: dbUser.profile_data?.firstName || '',
    lastName: dbUser.profile_data?.lastName || '',
    displayName: dbUser.profile_data?.displayName || '',
    avatar: dbUser.profile_data?.avatar || '',
    dateOfBirth: dbUser.profile_data?.dateOfBirth || '',
    preferences: dbUser.profile_data?.preferences,
  };

  const fullName = [profileData.firstName, profileData.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: dbUser.id,
    phoneNumber: dbUser.phone_number,
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    name: profileData.displayName || fullName,
    avatar: profileData.avatar || undefined,
    onboardingCompleted: dbUser.onboarding_completed || false,
    isVerified: dbUser.is_verified,
    biometricEnabled: dbUser.biometric_enabled,
    notificationsEnabled: dbUser.notifications_enabled || false,
    locationEnabled: dbUser.location_enabled || false,
    smsEnabled: dbUser.sms_enabled || false,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    lastLogin: dbUser.last_login,
    profileData,
  };
}
