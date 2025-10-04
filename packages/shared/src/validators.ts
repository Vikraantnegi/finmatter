/**
 * Validation utilities for FinMatter
 */

import { VALIDATION_RULES } from './constants';

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return VALIDATION_RULES.email.test(email.trim());
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return VALIDATION_RULES.phone.test(cleaned);
};

/**
 * Validate card number (last 4 digits)
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  const cleaned = cardNumber.replace(/\D/g, '');
  return VALIDATION_RULES.cardNumber.test(cleaned) && cleaned.length === 4;
};

/**
 * Validate amount (positive number with max 2 decimal places)
 */
export const validateAmount = (amount: string | number): boolean => {
  if (amount === null || amount === undefined) return false;
  
  const amountStr = typeof amount === 'string' ? amount : amount.toString();
  if (!amountStr.trim()) return false;
  
  const num = parseFloat(amountStr);
  return !isNaN(num) && num > 0 && VALIDATION_RULES.amount.test(amountStr);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = VALIDATION_RULES.password;
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate string length
 */
export const validateStringLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): string | null => {
  if (!value || typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  
  return null;
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: Date,
  endDate: Date,
  fieldName: string = 'Date range'
): string | null => {
  if (!startDate || !endDate) {
    return `${fieldName} must have both start and end dates`;
  }
  
  if (startDate >= endDate) {
    return `${fieldName} start date must be before end date`;
  }
  
  return null;
};

/**
 * Validate file type
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[],
  fieldName: string = 'File'
): string | null => {
  if (!file || !file.type) {
    return `${fieldName} is required`;
  }
  
  if (!allowedTypes.includes(file.type)) {
    return `${fieldName} must be one of: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};

/**
 * Validate file size
 */
export const validateFileSize = (
  file: File,
  maxSizeInBytes: number,
  fieldName: string = 'File'
): string | null => {
  if (!file) {
    return `${fieldName} is required`;
  }
  
  if (file.size > maxSizeInBytes) {
    const maxSizeMB = Math.round(maxSizeInBytes / (1024 * 1024));
    return `${fieldName} size must not exceed ${maxSizeMB}MB`;
  }
  
  return null;
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate Indian PIN code
 */
export const validatePinCode = (pinCode: string): boolean => {
  if (!pinCode || typeof pinCode !== 'string') return false;
  const cleaned = pinCode.replace(/\D/g, '');
  return /^[1-9][0-9]{5}$/.test(cleaned);
};

/**
 * Validate IFSC code
 */
export const validateIfscCode = (ifsc: string): boolean => {
  if (!ifsc || typeof ifsc !== 'string') return false;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
};

/**
 * Validate PAN number
 */
export const validatePanNumber = (pan: string): boolean => {
  if (!pan || typeof pan !== 'string') return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
};

/**
 * Validate Aadhaar number
 */
export const validateAadhaarNumber = (aadhaar: string): boolean => {
  if (!aadhaar || typeof aadhaar !== 'string') return false;
  const cleaned = aadhaar.replace(/\D/g, '');
  return /^[2-9]{1}[0-9]{11}$/.test(cleaned);
};

/**
 * Validate GST number
 */
export const validateGstNumber = (gst: string): boolean => {
  if (!gst || typeof gst !== 'string') return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase());
};

/**
 * Validate percentage (0-100)
 */
export const validatePercentage = (percentage: number): boolean => {
  return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validate non-negative number
 */
export const validateNonNegativeNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

/**
 * Validate integer
 */
export const validateInteger = (value: number): boolean => {
  return typeof value === 'number' && Number.isInteger(value) && !isNaN(value);
};

/**
 * Validate array length
 */
export const validateArrayLength = (
  array: any[],
  minLength: number,
  maxLength: number,
  fieldName: string = 'Array'
): string | null => {
  if (!Array.isArray(array)) {
    return `${fieldName} must be an array`;
  }
  
  if (array.length < minLength) {
    return `${fieldName} must have at least ${minLength} items`;
  }
  
  if (array.length > maxLength) {
    return `${fieldName} must not have more than ${maxLength} items`;
  }
  
  return null;
};

/**
 * Validate enum value
 */
export const validateEnum = (
  value: any,
  enumValues: readonly any[],
  fieldName: string = 'Value'
): string | null => {
  if (!enumValues.includes(value)) {
    return `${fieldName} must be one of: ${enumValues.join(', ')}`;
  }
  return null;
};

/**
 * Validate object properties
 */
export const validateObjectProperties = (
  obj: any,
  requiredProperties: string[],
  fieldName: string = 'Object'
): string | null => {
  if (!obj || typeof obj !== 'object') {
    return `${fieldName} must be an object`;
  }
  
  const missingProperties = requiredProperties.filter(prop => !(prop in obj));
  
  if (missingProperties.length > 0) {
    return `${fieldName} is missing required properties: ${missingProperties.join(', ')}`;
  }
  
  return null;
};

/**
 * Validate all fields in an object
 */
export const validateFields = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[char] || char;
    });
};

/**
 * Sanitize number input
 */
export const sanitizeNumber = (input: any): number | null => {
  if (input === null || input === undefined || input === '') return null;
  
  const num = typeof input === 'number' ? input : parseFloat(input);
  return isNaN(num) ? null : num;
};
