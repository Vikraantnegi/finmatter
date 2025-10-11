'use client';

import { useEffect } from 'react';

/**
 * Hook to block scrolling on the body element
 * Useful for modals, drawers, and other overlays
 */
export function useBlockScroll(shouldBlock: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (shouldBlock) {
      // Block scrolling by setting overflow: hidden
      document.body.style.overflow = 'hidden';
    } else {
      // Restore original overflow style
      document.body.style.overflow = originalStyle;
    }

    // Cleanup function to restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [shouldBlock]);
}

/**
 * Alternative hook that preserves scroll position
 * This version saves the current scroll position and restores it when unblocking
 */
export function useBlockScrollWithPosition(shouldBlock: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scrollPosition = 0;

    if (shouldBlock) {
      // Save current scroll position
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

      // Block scrolling and maintain position
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scrolling and position
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Restore scroll position
      window.scrollTo(0, scrollPosition);
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollPosition > 0) {
        window.scrollTo(0, scrollPosition);
      }
    };
  }, [shouldBlock]);
}
