'use client';

import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UploadStatementWidgetProps {
  onUpload: () => void;
  className?: string;
}

export function UploadStatementWidget({
  onUpload,
  className = '',
}: UploadStatementWidgetProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className='flex flex-col items-center text-center space-y-4'>
        <div className='w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center'>
          <FileText className='w-6 h-6 text-primary-600' />
        </div>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Upload Statement
          </h3>
          <p className='text-sm text-gray-600 mt-1'>
            Upload your statement to see credit limit and utilization
          </p>
        </div>
        <Button
          onClick={onUpload}
          className='flex items-center space-x-2 w-full sm:w-auto'
        >
          <Upload className='w-4 h-4' />
          <span>Upload Statement</span>
        </Button>
      </div>
    </div>
  );
}
