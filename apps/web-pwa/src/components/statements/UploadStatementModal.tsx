'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { statementService, type BankName } from '@/services/statementService';
import toast from 'react-hot-toast';

interface UploadStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardName: string;
  bankName: string;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function UploadStatementModal({
  isOpen,
  onClose,
  cardId,
  cardName,
  bankName: defaultBankName,
  onSuccess,
}: UploadStatementModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    // Normalize bank name to BankName type
    const normalizedBank = defaultBankName.toLowerCase().replace(/\s+/g, '');
    let bankNameValue: BankName = 'hdfc';
    if (normalizedBank.includes('hdfc')) bankNameValue = 'hdfc';
    else if (normalizedBank.includes('icici')) bankNameValue = 'icici';
    else if (normalizedBank.includes('sbi') || normalizedBank.includes('state'))
      bankNameValue = 'sbi';
    else if (normalizedBank.includes('axis')) bankNameValue = 'axis';
    else if (normalizedBank.includes('kotak')) bankNameValue = 'kotak';
    else if (normalizedBank.includes('citi')) bankNameValue = 'citi';
    else if (
      normalizedBank.includes('amex') ||
      normalizedBank.includes('american')
    )
      bankNameValue = 'amex';
    else if (normalizedBank.includes('hsbc')) bankNameValue = 'hsbc';

    try {
      const response = await statementService.uploadStatement(
        selectedFile,
        cardId,
        bankNameValue,
        password || undefined,
      );

      if (response.success) {
        setUploadStatus('success');
        toast.success(
          response.data?.message || 'Statement uploaded successfully!',
        );
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setUploadStatus('error');
        const errorMsg = response.error?.message || 'Upload failed';
        setErrorMessage(errorMsg);

        // Check if error is due to password
        if (
          errorMsg.toLowerCase().includes('password') ||
          errorMsg.toLowerCase().includes('encrypted')
        ) {
          toast.error('PDF is password protected. Please enter the password.');
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      setUploadStatus('error');
      const message = error instanceof Error ? error.message : 'Upload failed';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPassword('');
    setShowPassword(false);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title='Upload Statement'>
      <div className='space-y-6 pb-6'>
        {/* Card Info */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <p className='text-sm text-gray-600'>Uploading statement for</p>
          <p className='text-base font-semibold text-gray-900'>{cardName}</p>
        </div>

        {/* PDF Password (Optional) */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            PDF Password <span className='text-gray-400'>(Optional)</span>
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter password if PDF is protected'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10'
              disabled={isUploading}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              disabled={isUploading}
            >
              {showPassword ? (
                <EyeOff className='w-5 h-5' />
              ) : (
                <Eye className='w-5 h-5' />
              )}
            </button>
          </div>
          <p className='text-xs text-gray-500 mt-1.5'>
            Common passwords: Last 4 digits of card, DOB (DDMMYYYY), or PAN last
            4 chars
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Select PDF Statement
          </label>

          <input
            ref={fileInputRef}
            type='file'
            accept='application/pdf'
            onChange={handleFileSelect}
            className='hidden'
            disabled={isUploading}
          />

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className='w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <div className='flex flex-col items-center space-y-3'>
                <div className='w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center'>
                  <Upload className='w-6 h-6 text-primary-600' />
                </div>
                <div className='text-center'>
                  <p className='text-sm font-medium text-gray-900'>
                    Click to upload PDF
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Maximum file size: 5MB
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div className='border border-gray-300 rounded-lg p-4'>
              <div className='flex items-start space-x-3'>
                <FileText className='w-10 h-10 text-gray-400 flex-shrink-0' />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {selectedFile.name}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {formatFileSize(selectedFile.size)}
                  </p>

                  {uploadStatus === 'success' && (
                    <div className='flex items-center space-x-2 mt-2 text-green-600'>
                      <CheckCircle className='w-4 h-4' />
                      <span className='text-sm'>Upload successful!</span>
                    </div>
                  )}

                  {uploadStatus === 'error' && errorMessage && (
                    <div className='flex items-start space-x-2 mt-2 text-red-600'>
                      <AlertCircle className='w-4 h-4 flex-shrink-0 mt-0.5' />
                      <span className='text-sm'>{errorMessage}</span>
                    </div>
                  )}
                </div>
                {!isUploading && uploadStatus !== 'success' && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <X className='w-5 h-5' />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Message */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-blue-800'>
              <p className='font-medium'>What happens next?</p>
              <p className='mt-1'>
                Your statement will be parsed automatically. Transactions will
                appear within a few minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex space-x-3'>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={isUploading}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !selectedFile || isUploading || uploadStatus === 'success'
            }
            className='flex-1'
          >
            {isUploading ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                Uploading...
              </>
            ) : uploadStatus === 'success' ? (
              'Uploaded!'
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
