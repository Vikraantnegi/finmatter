/**
 * Avatar Utilities
 * Generate default avatars with initials and background colors
 */

// Predefined color palette for avatars (matching design tokens)
const AVATAR_COLORS = [
  '#13a4ec', // Primary
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

/**
 * Get initials from name
 * @param name - User's full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';

  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    // Single name: take first 2 characters
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Multiple names: take first letter of first and last name
  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];
  return (firstInitial + lastInitial).toUpperCase();
}

/**
 * Get consistent color for a name (same name always gets same color)
 * @param name - User's name
 * @returns Hex color code
 */
export function getAvatarColor(name: string): string {
  if (!name || !name.trim()) return AVATAR_COLORS[0];

  // Use simple hash to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Get contrasting text color (black or white) for a background color
 * @param hexColor - Background color in hex format
 * @returns 'black' or 'white'
 */
export function getContrastColor(hexColor: string): 'black' | 'white' {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Generate avatar data for a user
 * @param name - User's name
 * @param avatarUrl - Optional avatar URL
 * @returns Avatar data object
 */
export function generateAvatarData(name: string, avatarUrl?: string | null) {
  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(name);
  const textColor = getContrastColor(backgroundColor);

  return {
    initials,
    backgroundColor,
    textColor,
    hasCustomAvatar: !!avatarUrl,
    avatarUrl: avatarUrl || undefined,
  };
}

/**
 * Check if avatar is a preset emoji
 * @param avatar - Avatar string
 * @returns true if it's an emoji
 */
export function isEmojiAvatar(avatar?: string | null): boolean {
  if (!avatar) return false;

  // Check if it's a single emoji character or emoji with zero-width joiners
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;
  return emojiRegex.test(avatar);
}

/**
 * Check if avatar is a URL (uploaded image)
 * @param avatar - Avatar string
 * @returns true if it's a URL
 */
export function isImageUrl(avatar?: string | null): boolean {
  if (!avatar) return false;
  return avatar.startsWith('http://') || avatar.startsWith('https://');
}
