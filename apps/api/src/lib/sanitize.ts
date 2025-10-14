/**
 * Input Sanitization Utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize general text input (remove potentially harmful characters)
 */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 500); // Max length
}

/**
 * Sanitize bank or card name (more restrictive)
 */
export function sanitizeCardName(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove quotes and brackets
    .replace(/[^\w\s\-&]/g, '') // Only allow alphanumeric, spaces, hyphens, ampersands
    .substring(0, 100); // Max 100 chars for card/bank names
}

/**
 * Sanitize last 4 digits (ensure only digits, exactly 4)
 */
export function sanitizeLastFourDigits(input: string): string {
  return input.replace(/\D/g, '').substring(0, 4);
}

/**
 * Validate and sanitize credit amount (prevent negative or unrealistic values)
 */
export function sanitizeCreditAmount(input: number): number {
  const sanitized = Math.abs(input); // Ensure positive
  return Math.min(sanitized, 100000000); // Max 10 crore (₹10,00,00,000)
}

/**
 * Sanitize category name
 */
export function sanitizeCategory(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '')
    .replace(/[^\w\s-]/g, '')
    .substring(0, 50); // Max 50 chars for categories
}

/**
 * Sanitize description/notes (allow more characters but prevent XSS)
 */
export function sanitizeDescription(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 1000); // Max 1000 chars for descriptions
}

/**
 * Sanitize phone number (extract only digits, ensure valid format)
 */
export function sanitizePhoneNumber(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // For Indian numbers, expect 10 digits after country code
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.substring(2); // Remove +91
  }

  return digits;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().substring(0, 255);
}

/**
 * Sanitize JSON input (ensure it's valid and safe)
 */
export function sanitizeJSON(input: any): any {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch {
      return {};
    }
  }

  if (typeof input === 'object' && input !== null) {
    // Remove any potentially harmful keys
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      const safeKey = sanitizeText(key);
      if (typeof value === 'string') {
        sanitized[safeKey] = sanitizeText(value);
      } else if (typeof value === 'number') {
        sanitized[safeKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[safeKey] = value;
      } else if (Array.isArray(value)) {
        sanitized[safeKey] = value.map(v =>
          typeof v === 'string' ? sanitizeText(v) : v,
        );
      }
    }
    return sanitized;
  }

  return {};
}
