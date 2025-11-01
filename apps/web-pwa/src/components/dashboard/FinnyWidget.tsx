'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';

interface FinnyWidgetProps {
  className?: string;
}

export function FinnyWidget({ className = '' }: FinnyWidgetProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`px-6 ${className}`}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/finny')}
        className='w-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-800/30 rounded-2xl p-6 text-left group overflow-hidden relative'
      >
        {/* Background Glow */}
        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

        {/* Content */}
        <div className='relative flex items-center gap-4'>
          {/* Icon */}
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className='w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg'
          >
            <Bot className='w-7 h-7 text-white' />
          </motion.div>

          {/* Text */}
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='text-lg font-bold text-white'>
                Personal AI Finance Assistant
              </h3>
              <Sparkles className='w-4 h-4 text-yellow-400 animate-pulse' />
            </div>
            <p className='text-sm text-gray-300'>
              Ask &apos;Finny&apos; for insights & advice.
            </p>
          </div>

          {/* Arrow */}
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className='flex-shrink-0'
          >
            <div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center'>
              <ArrowRight className='w-5 h-5 text-primary' />
            </div>
          </motion.div>
        </div>

        {/* Chat Button Label */}
        <div className='mt-4 relative'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20'>
            <span className='text-sm font-medium text-primary'>Chat</span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}
