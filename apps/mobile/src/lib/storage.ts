/**
 * Secure Storage Service
 * Uses MMKV for fast, encrypted key-value storage
 */

import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage instance
const mmkvStorage = new MMKV({
  id: 'finmatter-storage',
  encryptionKey: 'finmatter-secure-key-2024', // In production, use a more secure key
});

/**
 * Storage service with type-safe methods
 */
export const storageService = {
  /**
   * Set a value in storage
   */
  set: <T>(key: string, value: T): void => {
    try {
      const jsonValue = JSON.stringify(value);
      mmkvStorage.set(key, jsonValue);
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },

  /**
   * Get a value from storage
   */
  get: <T>(key: string): T | null => {
    try {
      const jsonValue = mmkvStorage.getString(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * Delete a value from storage
   */
  delete: (key: string): void => {
    try {
      mmkvStorage.delete(key);
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  },

  /**
   * Check if a key exists in storage
   */
  has: (key: string): boolean => {
    try {
      return mmkvStorage.contains(key);
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  },

  /**
   * Clear all storage
   */
  clear: (): void => {
    try {
      mmkvStorage.clearAll();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },

  /**
   * Get all keys
   */
  getAllKeys: (): string[] => {
    try {
      return mmkvStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },
};

// Export the storage instance with type-safe methods
export const storage = {
  set: storageService.set,
  get: storageService.get,
  delete: storageService.delete,
  contains: storageService.has,
  clearAll: storageService.clear,
  getAllKeys: storageService.getAllKeys,
};
