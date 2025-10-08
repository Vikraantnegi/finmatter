'use client';

interface StorageValue<T> {
  state: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_EXPIRY_DAYS = 10;
const DEFAULT_EXPIRY_MS = DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const expiringStorage = {
  getItem: <T>(name: string): T | null => {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(name);
      if (!item) return null;

      const parsed: StorageValue<T> = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (now > parsed.expiresAt) {
        localStorage.removeItem(name);
        return null;
      }

      return parsed.state;
    } catch (error) {
      console.error('Error reading from storage:', error);
      localStorage.removeItem(name);
      return null;
    }
  },

  setItem: <T>(name: string, value: T): void => {
    if (typeof window === 'undefined') return;

    try {
      const storageValue: StorageValue<T> = {
        state: value,
        timestamp: Date.now(),
        expiresAt: Date.now() + DEFAULT_EXPIRY_MS,
      };

      localStorage.setItem(name, JSON.stringify(storageValue));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },

  // Custom method to extend expiration
  extendExpiry: <T>(name: string): void => {
    if (typeof window === 'undefined') return;

    try {
      const item = localStorage.getItem(name);
      if (!item) return;

      const parsed: StorageValue<T> = JSON.parse(item);
      const now = Date.now();

      // Only extend if not expired
      if (now <= parsed.expiresAt) {
        const updatedValue: StorageValue<T> = {
          ...parsed,
          expiresAt: now + DEFAULT_EXPIRY_MS,
        };

        localStorage.setItem(name, JSON.stringify(updatedValue));
      }
    } catch (error) {
      console.error('Error extending storage expiry:', error);
    }
  },

  // Get remaining time in milliseconds
  getRemainingTime: (name: string): number => {
    if (typeof window === 'undefined') return 0;

    try {
      const item = localStorage.getItem(name);
      if (!item) return 0;

      const parsed: StorageValue<any> = JSON.parse(item);
      const now = Date.now();

      return Math.max(0, parsed.expiresAt - now);
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 0;
    }
  },
};
