/**
 * Formatting utilities for FinMatter
 */

import { format, parseISO, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN',
): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback formatting
    return `₹${amount.toFixed(2)}`;
  }
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (
  number: number,
  locale: string = 'en-IN',
): string => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat(locale).format(number);
  } catch {
    return number.toString();
  }
};

/**
 * Format currency with Indian notation (K for thousands, L for Lakhs, Cr for Crores)
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  // Crores (1,00,00,000)
  if (absAmount >= 10000000) {
    const crores = absAmount / 10000000;
    return `${sign}₹${crores.toFixed(2)}Cr`;
  }

  // Lakhs (1,00,000)
  if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `${sign}₹${lakhs.toFixed(2)}L`;
  }

  // Thousands (1,000)
  if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    return `${sign}₹${thousands.toFixed(2)}K`;
  }

  // Less than 1000 - show with 2 decimals
  return `${sign}₹${absAmount.toFixed(2)}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format date for display
 */
export const formatDate = (
  date: Date | string,
  formatString: string = 'MMM dd, yyyy',
  timezone?: string,
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    // If timezone is specified, use date-fns-tz
    if (timezone) {
      return formatInTimeZone(dateObj, timezone, formatString);
    }

    return format(dateObj, formatString);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date in IST (Indian Standard Time)
 */
export const formatDateIST = (
  date: Date | string,
  formatString: string = 'MMM dd, yyyy',
): string => {
  return formatDate(date, formatString, 'Asia/Kolkata');
};

/**
 * Format date and time in IST
 */
export const formatDateTimeIST = (
  date: Date | string,
  formatString: string = 'MMM dd, yyyy HH:mm',
): string => {
  return formatDate(date, formatString, 'Asia/Kolkata');
};

/**
 * Format time in IST
 */
export const formatTimeIST = (date: Date | string): string => {
  return formatDate(date, 'HH:mm', 'Asia/Kolkata');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format duration in human readable format
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format phone number (Indian format)
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format as +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return phone; // Return original if format is not recognized
};

/**
 * Format card number (masked)
 */
export const formatCardNumber = (
  cardNumber: string,
  visibleDigits: number = 4,
): string => {
  if (!cardNumber) return '';

  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < visibleDigits) {
    return cleaned;
  }

  const visible = cleaned.slice(-visibleDigits);
  const masked = '*'.repeat(cleaned.length - visibleDigits);

  return masked + visible;
};

/**
 * Format bank account number (masked)
 */
export const formatAccountNumber = (
  accountNumber: string,
  visibleDigits: number = 4,
): string => {
  if (!accountNumber) return '';

  const cleaned = accountNumber.replace(/\D/g, '');

  if (cleaned.length < visibleDigits) {
    return cleaned;
  }

  const visible = cleaned.slice(-visibleDigits);
  const masked = '*'.repeat(cleaned.length - visibleDigits);

  return masked + visible;
};

/**
 * Format IFSC code
 */
export const formatIfscCode = (ifsc: string): string => {
  if (!ifsc) return '';

  return ifsc.toUpperCase().replace(/\s/g, '');
};

/**
 * Format PAN number
 */
export const formatPanNumber = (pan: string): string => {
  if (!pan) return '';

  // Remove spaces and convert to uppercase
  const cleaned = pan.replace(/\s/g, '').toUpperCase();

  // Format as AAAAA0000A
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
  }

  return cleaned;
};

/**
 * Format Aadhaar number
 */
export const formatAadhaarNumber = (aadhaar: string): string => {
  if (!aadhaar) return '';

  // Remove all non-digits
  const cleaned = aadhaar.replace(/\D/g, '');

  // Format as 0000 0000 0000
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }

  return cleaned;
};

/**
 * Format GST number
 */
export const formatGstNumber = (gst: string): string => {
  if (!gst) return '';

  const cleaned = gst.replace(/\s/g, '').toUpperCase();

  if (cleaned.length === 15) {
    return `${cleaned.slice(0, 2)}${cleaned.slice(2, 7)}${cleaned.slice(7, 11)}${cleaned.slice(11, 13)}${cleaned.slice(13)}`;
  }

  return cleaned;
};

/**
 * Format name (capitalize each word)
 */
export const formatName = (name: string): string => {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format address
 */
export const formatAddress = (address: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}): string => {
  const parts = [];

  if (address.line1) parts.push(address.line1);
  if (address.line2) parts.push(address.line2);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);
  if (address.country) parts.push(address.country);

  return parts.join(', ');
};

/**
 * Format transaction description
 */
export const formatTransactionDescription = (
  description: string,
  maxLength: number = 50,
): string => {
  if (!description) return '';

  if (description.length <= maxLength) {
    return description;
  }

  return `${description.slice(0, maxLength - 3)}...`;
};

/**
 * Format merchant name
 */
export const formatMerchantName = (merchantName: string): string => {
  if (!merchantName) return '';

  return merchantName
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Keep common words lowercase
      const commonWords = [
        'the',
        'and',
        'of',
        'in',
        'at',
        'to',
        'for',
        'with',
        'on',
      ];
      if (commonWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Format category name
 */
export const formatCategoryName = (category: string): string => {
  if (!category) return '';

  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format bank name
 */
export const formatBankName = (bankName: string): string => {
  if (!bankName) return '';

  return bankName
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Capitalize first letter of each word
      if (word === 'bank') return 'Bank';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Format card name
 */
export const formatCardName = (cardName: string): string => {
  if (!cardName) return '';

  return cardName
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Capitalize first letter of each word
      if (word === 'card' || word === 'credit' || word === 'debit') {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Format error message
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  return 'An unexpected error occurred';
};

/**
 * Format validation errors
 */
export const formatValidationErrors = (
  errors: Record<string, string>,
): string[] => {
  return Object.entries(errors).map(([field, message]) => {
    const formattedField = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

    return `${formattedField}: ${message}`;
  });
};

/**
 * Format success message
 */
export const formatSuccessMessage = (message: string, data?: any): string => {
  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const key = keys[0];
      if (key) {
        const value = data[key];
        return `${message}: ${value}`;
      }
    }
  }

  return message;
};
