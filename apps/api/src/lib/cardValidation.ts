/**
 * Card Validation Service
 *
 * Validates card numbers, expiry dates, CVV, and detects card networks
 */

import { CardNetwork, CardType } from '@finmatter/types';
import {
  detectNetwork as sharedDetectNetwork,
  toCardNetwork,
} from '@finmatter/shared/cardDetection';

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  // Remove spaces, dashes, and other non-digits
  const cleaned = cardNumber.replace(/\D/g, '');

  // Check length (13-19 digits)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  // Process from right to left
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export function detectNetwork(cardNumber: string): CardNetwork | null {
  return toCardNetwork(sharedDetectNetwork(cardNumber)) as CardNetwork | null;
}

/**
 * Validate card format and get metadata
 */
export function validateCardFormat(cardNumber: string): {
  valid: boolean;
  network?: CardNetwork;
  cardType?: CardType;
  length?: number;
  message?: string;
} {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return {
      valid: false,
      message: 'Card number must be between 13 and 19 digits',
    };
  }

  const network = detectNetwork(cleaned);

  // Network-specific length validation
  if (network === 'amex' && cleaned.length !== 15) {
    return {
      valid: false,
      network,
      length: cleaned.length,
      message: 'American Express cards must be 15 digits',
    };
  }

  if (network === 'diners' && cleaned.length !== 14) {
    return {
      valid: false,
      network,
      length: cleaned.length,
      message: 'Diners Club cards must be 14 digits',
    };
  }

  if (
    (network === 'visa' ||
      network === 'mastercard' ||
      network === 'discover' ||
      network === 'rupay') &&
    cleaned.length !== 16
  ) {
    return {
      valid: false,
      network,
      length: cleaned.length,
      message: `${network} cards must be 16 digits`,
    };
  }

  // Card type hint (basic detection, not 100% accurate)
  const cardType: CardType = 'credit'; // Default assumption

  return {
    valid: true,
    network: network || undefined,
    cardType,
    length: cleaned.length,
  };
}

/**
 * Validate expiry date
 */
export function validateExpiry(
  month: number,
  year: number,
): {
  valid: boolean;
  message?: string;
} {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Validate month
  if (month < 1 || month > 12) {
    return {
      valid: false,
      message: 'Month must be between 1 and 12',
    };
  }

  // Validate year (should be 4 digits)
  if (year < 2000 || year > 2099) {
    return {
      valid: false,
      message: 'Year must be between 2000 and 2099',
    };
  }

  // Check if expired
  if (year < currentYear) {
    return {
      valid: false,
      message: 'Card has expired',
    };
  }

  if (year === currentYear && month < currentMonth) {
    return {
      valid: false,
      message: 'Card has expired',
    };
  }

  return { valid: true };
}

/**
 * Extract BIN (Bank Identification Number) from card number
 */
export function extractBIN(cardNumber: string): string | null {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 6) {
    return null;
  }

  // First 6 digits
  return cleaned.substring(0, 6);
}

/**
 * Extract last 4 digits from card number
 */
export function extractLastFour(cardNumber: string): string | null {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 4) {
    return null;
  }

  return cleaned.substring(cleaned.length - 4);
}

/**
 * Format card number with spaces (e.g., "1234 5678 9012 3456")
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');

  // Group by 4 digits
  const groups = cleaned.match(/.{1,4}/g);
  if (!groups) {
    return cleaned;
  }

  return groups.join(' ');
}

/**
 * Mask card number (show only last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 4) {
    return '****';
  }

  const lastFour = cleaned.substring(cleaned.length - 4);
  const masked = '*'.repeat(Math.max(0, cleaned.length - 4));

  return masked + lastFour;
}
