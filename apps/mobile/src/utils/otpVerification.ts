/**
 * OTP Verification Utilities
 * Handles 30-day OTP re-verification logic
 */

export const OTP_VERIFICATION_DAYS = 30; // Days after which OTP re-verification is required

/**
 * Checks if OTP re-verification is required based on last verification date
 * @param lastOtpVerification - ISO date string of last OTP verification
 * @returns true if OTP re-verification is required
 */
export const isOTPReVerificationRequired = (
  lastOtpVerification?: string,
): boolean => {
  if (!lastOtpVerification) {
    // If no previous verification, require OTP
    return true;
  }

  const lastVerificationDate = new Date(lastOtpVerification);
  const currentDate = new Date();
  const daysDifference =
    (currentDate.getTime() - lastVerificationDate.getTime()) /
    (1000 * 60 * 60 * 24);

  return daysDifference > OTP_VERIFICATION_DAYS;
};

/**
 * Gets the number of days remaining before OTP re-verification is required
 * @param lastOtpVerification - ISO date string of last OTP verification
 * @returns number of days remaining (negative if expired)
 */
export const getDaysUntilOTPExpiry = (lastOtpVerification?: string): number => {
  if (!lastOtpVerification) {
    return 0; // No previous verification, expired
  }

  const lastVerificationDate = new Date(lastOtpVerification);
  const currentDate = new Date();
  const daysDifference =
    (currentDate.getTime() - lastVerificationDate.getTime()) /
    (1000 * 60 * 60 * 24);

  return Math.max(0, OTP_VERIFICATION_DAYS - daysDifference);
};

/**
 * Gets a user-friendly message about OTP verification status
 * @param lastOtpVerification - ISO date string of last OTP verification
 * @returns user-friendly message
 */
export const getOTPVerificationMessage = (
  lastOtpVerification?: string,
): string => {
  const daysRemaining = getDaysUntilOTPExpiry(lastOtpVerification);

  if (daysRemaining === 0) {
    return 'OTP verification required for security';
  } else if (daysRemaining <= 7) {
    return `OTP verification required in ${Math.ceil(daysRemaining)} days`;
  } else {
    return `OTP valid for ${Math.ceil(daysRemaining)} more days`;
  }
};

/**
 * Formats the last OTP verification date for display
 * @param lastOtpVerification - ISO date string of last OTP verification
 * @returns formatted date string
 */
export const formatLastOTPVerification = (
  lastOtpVerification?: string,
): string => {
  if (!lastOtpVerification) {
    return 'Never';
  }

  const date = new Date(lastOtpVerification);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};
