/**
 * Card Encryption Service
 *
 * Encrypts sensitive card data using AES-256-GCM
 * Never stores full card numbers, only last 4 digits
 */

import * as crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CARD_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'CARD_ENCRYPTION_KEY environment variable is required for card encryption',
    );
  }

  // Key should be 32 bytes (256 bits) for AES-256
  // If it's a hex string, decode it; otherwise use it directly
  if (key.length === 64) {
    // Hex string (64 chars = 32 bytes)
    return Buffer.from(key, 'hex');
  }

  // If it's a string, derive a key using PBKDF2
  return crypto.pbkdf2Sync(
    key,
    'finmatter-card-salt',
    ITERATIONS,
    KEY_LENGTH,
    'sha256',
  );
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export async function encryptCardData(data: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV + Auth Tag + Encrypted data
    // Format: base64(iv:authTag:encrypted)
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ]).toString('base64');

    return combined;
  } catch (error) {
    console.error('Card encryption error:', error);
    throw new Error('Failed to encrypt card data');
  }
}

/**
 * Decrypt card data
 */
export async function decryptCardData(encrypted: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encrypted, 'base64');

    // Extract IV, Auth Tag, and Encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Card decryption error:', error);
    throw new Error('Failed to decrypt card data');
  }
}

/**
 * Extract last 4 digits from card number (safe to store in plain text)
 */
export function extractLastFour(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 4) {
    throw new Error('Card number must have at least 4 digits');
  }

  return cleaned.substring(cleaned.length - 4);
}

/**
 * Encrypt CVV
 */
export async function encryptCVV(cvv: string): Promise<string> {
  // Validate CVV format
  const cleaned = cvv.replace(/\D/g, '');

  if (cleaned.length < 3 || cleaned.length > 4) {
    throw new Error('CVV must be 3 or 4 digits');
  }

  return encryptCardData(cleaned);
}

/**
 * Decrypt CVV (for display purposes only, should be done server-side)
 */
export async function decryptCVV(encrypted: string): Promise<string> {
  return decryptCardData(encrypted);
}
