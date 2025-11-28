'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Lock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import type { Card } from '@finmatter/types';

interface UploadStatementBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  onSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';
type UploadStep = 'upload' | 'parse' | 'complete';

export const UploadStatementBottomSheet = ({
  isOpen,
  onClose,
  card,
  onSuccess,
}: UploadStatementBottomSheetProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [bankName, setBankName] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Determine bank name from card
  React.useEffect(() => {
    if (card.bank?.name) {
      const bankSlug = card.bank.name.toLowerCase();
      // Map common bank names to parser bank names
      if (bankSlug.includes('hdfc')) {
        setBankName('hdfc');
      } else if (bankSlug.includes('icici')) {
        setBankName('icici');
      } else if (
        bankSlug.includes('amex') ||
        bankSlug.includes('american express')
      ) {
        setBankName('amex');
      } else {
        setBankName('hdfc'); // Default
      }
    }
  }, [card]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBankDropdownOpen(false);
      }
    };

    if (isBankDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBankDropdownOpen]);

  const banks = [
    { value: '', label: 'Select bank' },
    { value: 'hdfc', label: 'HDFC' },
    { value: 'icici', label: 'ICICI' },
    { value: 'amex', label: 'American Express' },
  ];

  const selectedBankLabel =
    banks.find(bank => bank.value === bankName)?.label || 'Select bank';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!bankName) {
      toast.error('Please select a bank');
      return;
    }

    setUploadStatus('uploading');
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('card_id', card.id);
      formData.append('bank_name', bankName);
      if (password) {
        formData.append('password', password);
      }

      interface UploadResponse {
        success: boolean;
        data?: {
          statement: {
            id: string;
            [key: string]: any;
          };
          message?: string;
        };
        error?: {
          message: string;
          code?: string;
        };
      }

      const response = await apiClient.post<UploadResponse>(
        '/api/statements/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(percentCompleted);
            }
          },
        },
      );

      if (response.success && response.data) {
        // Step 2: Parsing (background process)
        setCurrentStep('parse');
        setUploadStatus('parsing');
        setUploadProgress(0);

        toast.success('File uploaded! Parsing in progress...', {
          duration: 4000,
        });

        // Close the sheet after a short delay
        // The statement will be in "processing" status
        // User can check the statements page to see if parsing succeeded or failed
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      setUploadStatus('error');
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to upload statement';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (uploadStatus === 'uploading') {
      if (!confirm('Upload in progress. Are you sure you want to cancel?')) {
        return;
      }
    }

    setSelectedFile(null);
    setPassword('');
    setError(null);
    setUploadStatus('idle');
    setCurrentStep('upload');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={
        uploadStatus === 'uploading' || uploadStatus === 'parsing'
          ? 'Uploading Statement'
          : 'Upload Statement'
      }
      dark={true}
    >
      {/* Show Progress Only When Uploading/Parsing */}
      {uploadStatus === 'uploading' || uploadStatus === 'parsing' ? (
        <div className='px-6 py-8 pb-10 space-y-6'>
          {/* Step Indicators */}
          <div className='space-y-6'>
            {/* Upload Step */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === 'upload'
                      ? 'bg-primary text-white'
                      : currentStep === 'parse' || currentStep === 'complete'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {currentStep === 'parse' || currentStep === 'complete' ? (
                    <CheckCircle2 className='w-5 h-5' />
                  ) : (
                    '1'
                  )}
                </div>
                <span
                  className={`text-base font-medium ${
                    currentStep === 'upload'
                      ? 'text-white'
                      : currentStep === 'parse' || currentStep === 'complete'
                        ? 'text-green-400'
                        : 'text-gray-400'
                  }`}
                >
                  Uploading File
                </span>
              </div>
              {currentStep === 'upload' && (
                <div className='ml-11 space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-400'>
                      Uploading to server...
                    </span>
                    <span className='text-white font-medium'>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-primary h-2 rounded-full transition-all duration-300'
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className='flex justify-center ml-4'>
              <div className='text-gray-600 text-xl'>↓</div>
            </div>

            {/* Parse Step */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === 'parse'
                      ? 'bg-primary text-white animate-pulse'
                      : currentStep === 'complete'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {currentStep === 'complete' ? (
                    <CheckCircle2 className='w-5 h-5' />
                  ) : currentStep === 'parse' ? (
                    <LoadingSpinner size='sm' />
                  ) : (
                    '2'
                  )}
                </div>
                <span
                  className={`text-base font-medium ${
                    currentStep === 'parse'
                      ? 'text-white'
                      : currentStep === 'complete'
                        ? 'text-green-400'
                        : 'text-gray-400'
                  }`}
                >
                  Parsing PDF
                </span>
              </div>
              {currentStep === 'parse' && (
                <div className='ml-11 space-y-2'>
                  <p className='text-sm text-gray-400'>
                    Extracting transactions...
                  </p>
                  <div className='w-full bg-gray-700 rounded-full h-2 overflow-hidden'>
                    <div className='bg-primary h-2 rounded-full animate-pulse w-3/4' />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Message for Background Processing */}
          {currentStep === 'parse' && (
            <div className='p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl'>
              <div className='flex items-start gap-3'>
                <div className='text-2xl'>⏳</div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-blue-300 mb-1'>
                    Parsing in Progress
                  </p>
                  <p className='text-xs text-blue-200 leading-relaxed'>
                    Your statement is being processed in the background. This
                    typically takes 2-5 minutes. You can safely close this
                    window and check back later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white font-medium hover:bg-gray-700/50 transition-colors'
          >
            {currentStep === 'parse' ? 'Close' : 'Cancel'}
          </button>
        </div>
      ) : (
        <div className='px-6 py-4 pb-10 space-y-6'>
          {/* File Selection */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              Select PDF Statement
            </label>
            <input
              ref={fileInputRef}
              type='file'
              accept='.pdf,application/pdf'
              onChange={handleFileSelect}
              className='hidden'
            />
            <button
              type='button'
              onClick={handleFileClick}
              className='w-full p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800/30'
            >
              <div className='flex flex-col items-center gap-2'>
                <UploadCloud className='w-8 h-8 text-gray-400' />
                {selectedFile ? (
                  <div className='text-center'>
                    <FileText className='w-6 h-6 text-primary mx-auto mb-1' />
                    <p className='text-sm font-medium text-white'>
                      {selectedFile.name}
                    </p>
                    <p className='text-xs text-gray-400'>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className='text-center'>
                    <p className='text-sm text-gray-400'>
                      Click to select PDF file
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>Max size: 5MB</p>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Bank Selection */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              Bank
            </label>
            <div className='relative w-full' ref={bankDropdownRef}>
              <button
                type='button'
                onClick={() => {
                  setIsBankDropdownOpen(!isBankDropdownOpen);
                }}
                className='w-full h-14 pl-4 pr-12 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white text-left focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative'
              >
                <span className={bankName ? 'text-white' : 'text-gray-500'}>
                  {selectedBankLabel}
                </span>
                <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isBankDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {isBankDropdownOpen && (
                <div className='absolute z-50 w-full mt-1 bg-gray-800 border-2 border-gray-700 rounded-xl overflow-hidden shadow-lg'>
                  {banks.map(bank => (
                    <button
                      key={bank.value}
                      type='button'
                      onClick={() => {
                        setBankName(bank.value);
                        setIsBankDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-base transition-colors ${
                        bankName === bank.value
                          ? 'bg-primary text-white'
                          : 'text-white hover:bg-gray-700'
                      } ${bank.value === '' ? 'text-gray-400' : ''}`}
                    >
                      {bank.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Password (Required for CC Statements) */}
          <div>
            <label className='block text-sm font-medium text-white mb-2'>
              <div className='flex items-center gap-2'>
                <Lock className='w-4 h-4 text-primary' />
                <span>PDF Password</span>
                <span className='text-xs text-primary font-medium'>
                  (Required)
                </span>
              </div>
            </label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter PDF password (usually last 4 digits or DOB)'
              required
              className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50'
            />
            <p className='text-xs text-gray-400 mt-1'>
              Credit card statements are typically password-protected. The
              password is usually your card&apos;s last 4 digits or date of
              birth (DDMMYYYY).
            </p>
          </div>

          {/* Error Message */}
          {uploadStatus === 'error' && error && (
            <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-xl'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-400'>
                    Upload Failed
                  </p>
                  <p className='text-xs text-red-300 mt-1'>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'success' && (
            <div className='p-4 bg-green-500/10 border border-green-500/20 rounded-xl'>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='w-5 h-5 text-green-400 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-green-400'>
                    Upload Successful!
                  </p>
                  <p className='text-xs text-green-300 mt-1'>
                    Your statement has been processed successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={handleClose}
              className='flex-1 h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white font-medium hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                !bankName ||
                !password ||
                uploadStatus === 'success'
              }
              className='flex-1 h-14 px-4 bg-primary hover:opacity-90 rounded-xl text-white text-base font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center'
            >
              {uploadStatus === 'success' ? 'Done' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
