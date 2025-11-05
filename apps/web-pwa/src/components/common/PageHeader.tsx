'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  onBack?: () => void;
}

const PageHeader = ({ title, action, onBack }: PageHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='sticky top-0 z-20 bg-background-dark/95 backdrop-blur-sm border-b border-gray-800'
    >
      <div className='flex items-center justify-between px-4 py-4'>
        {/* Back Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 hover:bg-gray-800 transition-colors flex-shrink-0'
        >
          <ArrowLeft className='w-5 h-5 text-white' />
        </motion.button>

        {/* Title */}
        <h1 className='absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white'>
          {title}
        </h1>

        {/* Action (optional) */}
        <div className='flex-shrink-0 ml-auto'>{action}</div>
      </div>
    </motion.div>
  );
};

export default PageHeader;
