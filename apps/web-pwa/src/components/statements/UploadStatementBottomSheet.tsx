'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Lock,
  AlertCircle,
  CheckCircle2,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Close the sheet and let user check back later
        // The statement will be in "processing" status
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 3000);
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
    <BottomSheet isOpen={isOpen} onClose={handleClose} title='Upload Statement'>
      <div className='space-y-6 pb-6'>
        {/* File Selection */}
        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
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
            disabled={uploadStatus === 'uploading'}
            className='w-full p-4 border-2 border-dashed border-gray-600 rounded-xl hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            Bank
          </label>
          <select
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            disabled={uploadStatus === 'uploading'}
            className='w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50'
          >
            <option value=''>Select bank</option>
            <option value='hdfc'>HDFC</option>
            <option value='icici'>ICICI</option>
            <option value='amex'>American Express</option>
          </select>
        </div>

        {/* Password (Required for CC Statements) */}
        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>
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
            disabled={uploadStatus === 'uploading'}
            placeholder='Enter PDF password (usually last 4 digits or DOB)'
            required
            className='w-full px-4 py-3 bg-gray-800 border-2 border-primary/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50'
          />
          <p className='text-xs text-gray-400 mt-1'>
            Credit card statements are typically password-protected. The
            password is usually your card&apos;s last 4 digits or date of birth
            (DDMMYYYY).
          </p>
        </div>

        {/* Upload Progress - Step by Step */}
        {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && (
          <div className='space-y-4'>
            {/* Step Indicators */}
            <div className='flex items-center gap-4'>
              {/* Upload Step */}
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 'upload'
                        ? 'bg-primary text-white'
                        : currentStep === 'parse' || currentStep === 'complete'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {currentStep === 'parse' || currentStep === 'complete' ? (
                      <CheckCircle2 className='w-4 h-4' />
                    ) : (
                      '1'
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
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
                  <div className='ml-8 space-y-1'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-gray-400'>
                        Uploading to server...
                      </span>
                      <span className='text-white'>{uploadProgress}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-1.5'>
                      <div
                        className='bg-primary h-1.5 rounded-full transition-all duration-300'
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className='text-gray-600'>→</div>

              {/* Parse Step */}
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 'parse'
                        ? 'bg-primary text-white animate-pulse'
                        : currentStep === 'complete'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {currentStep === 'complete' ? (
                      <CheckCircle2 className='w-4 h-4' />
                    ) : currentStep === 'parse' ? (
                      <LoadingSpinner size='xs' />
                    ) : (
                      '2'
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
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
                  <div className='ml-8 space-y-1'>
                    <p className='text-xs text-gray-400'>
                      Extracting transactions...
                    </p>
                    <div className='w-full bg-gray-700 rounded-full h-1.5 overflow-hidden'>
                      <div
                        className='bg-primary h-1.5 rounded-full animate-pulse'
                        style={{ width: '60%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Message for Background Processing */}
            {currentStep === 'parse' && (
              <div className='p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <div className='text-2xl'>⏳</div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-blue-300 mb-1'>
                      Parsing in Progress
                    </p>
                    <p className='text-xs text-blue-200 leading-relaxed'>
                      Your statement is being processed in the background. This
                      typically takes 2-5 minutes. You can safely close this
                      window and check back later. The statement will appear in
                      your Statements page once processing is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
            disabled={
              uploadStatus === 'uploading' || uploadStatus === 'parsing'
            }
            className='flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {uploadStatus === 'uploading' || uploadStatus === 'parsing'
              ? 'Close'
              : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={
              !selectedFile ||
              !bankName ||
              !password ||
              uploadStatus === 'uploading' ||
              uploadStatus === 'parsing' ||
              uploadStatus === 'success'
            }
            className='flex-1 px-4 py-3 bg-primary hover:opacity-90 rounded-xl text-white font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          >
            {uploadStatus === 'uploading' ? (
              <>
                <LoadingSpinner size='sm' className='mr-2' />
                Uploading...
              </>
            ) : uploadStatus === 'parsing' ? (
              <>
                <LoadingSpinner size='sm' className='mr-2' />
                Processing...
              </>
            ) : uploadStatus === 'success' ? (
              'Done'
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
