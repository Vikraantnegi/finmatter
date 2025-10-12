/**
 * Card Color Utilities
 * Generate deterministic colors for cards based on bank name
 */

/**
 * Generate deterministic HSL color from string
 */
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 360);
}

/**
 * Generate card gradient colors from bank name
 * Returns consistent colors for the same bank
 */
export function generateCardColors(bankName: string): {
  primary: string;
  secondary: string;
} {
  const hue = stringToHue(bankName);

  // Use high saturation and medium lightness for vibrant, professional colors
  const primary = `hsl(${hue}, 65%, 50%)`;
  const secondary = `hsl(${(hue + 30) % 360}, 65%, 40%)`; // Slightly darker and shifted hue

  return { primary, secondary };
}

/**
 * Predefined colors for popular Indian banks
 * Override auto-generated colors for brand consistency
 */
export const BANK_COLORS: Record<
  string,
  { primary: string; secondary: string }
> = {
  'hdfc bank': {
    primary: '#004C8F',
    secondary: '#003366',
  },
  hdfc: {
    primary: '#004C8F',
    secondary: '#003366',
  },
  'sbi': {
    primary: '#1C4A93',
    secondary: '#0F2D5C',
  },
  'state bank of india': {
    primary: '#1C4A93',
    secondary: '#0F2D5C',
  },
  'icici bank': {
    primary: '#B94A12',
    secondary: '#8B3609',
  },
  icici: {
    primary: '#B94A12',
    secondary: '#8B3609',
  },
  'axis bank': {
    primary: '#97144D',
    secondary: '#6B0E36',
  },
  axis: {
    primary: '#97144D',
    secondary: '#6B0E36',
  },
  'kotak mahindra': {
    primary: '#ED232A',
    secondary: '#B71C22',
  },
  kotak: {
    primary: '#ED232A',
    secondary: '#B71C22',
  },
  'indusind bank': {
    primary: '#1C5A99',
    secondary: '#134270',
  },
  indusind: {
    primary: '#1C5A99',
    secondary: '#134270',
  },
  'yes bank': {
    primary: '#00539F',
    secondary: '#003D75',
  },
  yes: {
    primary: '#00539F',
    secondary: '#003D75',
  },
  'standard chartered': {
    primary: '#0F6CB6',
    secondary: '#0B5089',
  },
  'hsbc': {
    primary: '#DB0011',
    secondary: '#A5000D',
  },
  'citibank': {
    primary: '#003D7A',
    secondary: '#002C5A',
  },
  'american express': {
    primary: '#006FCF',
    secondary: '#00539F',
  },
  amex: {
    primary: '#006FCF',
    secondary: '#00539F',
  },
};

/**
 * Get card colors with fallback to auto-generation
 */
export function getCardColors(
  bankName: string,
  customPrimary?: string,
  customSecondary?: string,
): { primary: string; secondary: string } {
  // Use custom colors if provided
  if (customPrimary && customSecondary) {
    return { primary: customPrimary, secondary: customSecondary };
  }

  // Check for predefined bank colors
  const normalizedBankName = bankName.toLowerCase().trim();
  if (BANK_COLORS[normalizedBankName]) {
    return BANK_COLORS[normalizedBankName];
  }

  // Generate deterministic colors
  return generateCardColors(bankName);
}

/**
 * Check if card is expired
 */
export function isCardExpired(expiryDate?: Date | string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

/**
 * Check if card is expiring soon (within 3 months)
 */
export function isCardExpiringSoon(expiryDate?: Date | string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return expiry < threeMonthsFromNow && expiry > new Date();
}

/**
 * Get card status display info
 */
export function getCardStatusInfo(card: {
  status: string;
  expiryDate?: Date | string;
  deletedAt?: Date | string;
}): {
  label: string;
  color: string;
  bgColor: string;
  show: boolean;
} | null {
  // Deleted
  if (card.deletedAt) {
    return {
      label: 'DELETED',
      color: 'text-gray-700',
      bgColor: 'bg-gray-200',
      show: true,
    };
  }

  // Expired
  if (isCardExpired(card.expiryDate)) {
    return {
      label: 'EXPIRED',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      show: true,
    };
  }

  // Expiring soon
  if (isCardExpiringSoon(card.expiryDate)) {
    return {
      label: 'EXPIRES SOON',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      show: true,
    };
  }

  // Inactive
  if (card.status === 'inactive') {
    return {
      label: 'INACTIVE',
      color: 'text-gray-700',
      bgColor: 'bg-gray-200',
      show: true,
    };
  }

  // Blocked
  if (card.status === 'blocked') {
    return {
      label: 'BLOCKED',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      show: true,
    };
  }

  // Active - no badge needed
  return null;
}

