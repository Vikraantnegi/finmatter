'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  catchLine?: string;
  onComplete?: () => void;
  minimumDisplayTime?: number;
}

/**
 * SplashScreen Component
 * Displays the app logo, name, and tagline centered on dark background
 * Fades in on mount and fades out automatically
 */
export const SplashScreen = ({
  catchLine = 'Your Smartest Financial Move',
  onComplete,
  minimumDisplayTime = 1500,
}: SplashScreenProps) => {
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldFadeOut(true);

      setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, 500);
    }, minimumDisplayTime);

    return () => clearTimeout(timer);
  }, [minimumDisplayTime, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className='min-h-screen bg-background-dark flex items-center justify-center px-4 fixed inset-0 z-50'
          initial={{ opacity: 0 }}
          animate={{
            opacity: shouldFadeOut ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            className='flex flex-col items-center justify-center gap-3'
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: shouldFadeOut ? 0 : 1,
              y: shouldFadeOut ? -20 : 0,
            }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className='mb-1'
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: shouldFadeOut ? 0.9 : 1,
                opacity: shouldFadeOut ? 0 : 1,
              }}
              transition={{
                duration: 0.4,
                delay: 0.1,
                ease: 'easeOut',
              }}
            >
              <span
                className='material-symbols-outlined text-primary'
                style={{
                  fontSize: 'clamp(6rem, 15vw, 10rem)',
                  lineHeight: '1',
                  display: 'inline-block',
                }}
              >
                savings
              </span>
            </motion.div>

            <motion.h1
              className='text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center'
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: shouldFadeOut ? 0 : 1,
                y: shouldFadeOut ? -10 : 0,
              }}
              transition={{
                duration: 0.4,
                delay: 0.2,
                ease: 'easeOut',
              }}
            >
              FinMatter
            </motion.h1>

            <motion.p
              className='text-lg md:text-xl text-white text-center font-normal max-w-md mt-1'
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: shouldFadeOut ? 0 : 1,
                y: shouldFadeOut ? -10 : 0,
              }}
              transition={{
                duration: 0.4,
                delay: 0.3,
                ease: 'easeOut',
              }}
            >
              {catchLine}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
