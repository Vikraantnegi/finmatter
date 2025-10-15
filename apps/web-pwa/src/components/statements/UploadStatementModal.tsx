'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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

const BANK_OPTIONS: { value: BankName; label: string }[] = [
  { value: 'hdfc', label: 'HDFC Bank' },
  { value: 'icici', label: 'ICICI Bank' },
  { value: 'sbi', label: 'State Bank of India' },
  { value: 'axis', label: 'Axis Bank' },
  { value: 'kotak', label: 'Kotak Mahindra Bank' },
  { value: 'citi', label: 'Citi Bank' },
  { value: 'amex', label: 'American Express' },
  { value: 'hsbc', label: 'HSBC' },
];

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
  const [bankName, setBankName] = useState<BankName>(() => {
    const normalizedBank = defaultBankName.toLowerCase().replace(/\s+/g, '');
    if (normalizedBank.includes('hdfc')) return 'hdfc';
    if (normalizedBank.includes('icici')) return 'icici';
    if (normalizedBank.includes('sbi') || normalizedBank.includes('state'))
      return 'sbi';
    if (normalizedBank.includes('axis')) return 'axis';
    if (normalizedBank.includes('kotak')) return 'kotak';
    if (normalizedBank.includes('citi')) return 'citi';
    if (normalizedBank.includes('amex') || normalizedBank.includes('american'))
      return 'amex';
    if (normalizedBank.includes('hsbc')) return 'hsbc';
    return 'hdfc';
  });
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

    try {
      const response = await statementService.uploadStatement(
        selectedFile,
        cardId,
        bankName,
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
        setErrorMessage(response.error?.message || 'Upload failed');
        toast.error(response.error?.message || 'Failed to upload statement');
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
    <Modal isOpen={isOpen} onClose={handleClose} title='Upload Statement'>
      <div className='space-y-6'>
        {/* Card Info */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <p className='text-sm text-gray-600'>Uploading statement for</p>
          <p className='text-base font-semibold text-gray-900'>{cardName}</p>
        </div>

        {/* Bank Selection */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Select Bank
          </label>
          <select
            value={bankName}
            onChange={e => setBankName(e.target.value as BankName)}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            disabled={isUploading}
          >
            {BANK_OPTIONS.map(bank => (
              <option key={bank.value} value={bank.value}>
                {bank.label}
              </option>
            ))}
          </select>
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
              'Upload Statement'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
