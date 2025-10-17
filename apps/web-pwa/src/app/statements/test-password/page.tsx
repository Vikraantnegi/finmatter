'use client';

import React, { useState } from 'react';
import { Upload, FileText, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function TestPasswordPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [bankName, setBankName] = useState('hdfc');
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleTest = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsTesting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bankName', bankName);
      if (password) {
        formData.append('password', password);
      }

      const response: Record<string, any> = await apiClient.post(
        '/api/statements/test-password',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.success) {
        setResult(response.data.result);
        toast.success('PDF parsing test completed!');
      } else {
        toast.error(response.error?.message || 'Test failed');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.message || 'An error occurred during testing');
    } finally {
      setIsTesting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-2xl mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>
            Test Password-Protected PDF Parsing
          </h1>

          <div className='space-y-6'>
            {/* Bank Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Bank Name
              </label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                <option value='hdfc'>HDFC</option>
                <option value='icici'>ICICI</option>
                <option value='sbi'>SBI</option>
                <option value='axis'>Axis</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                PDF File
              </label>
              <input
                type='file'
                accept='.pdf'
                onChange={handleFileSelect}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
              {selectedFile && (
                <div className='mt-2 p-3 bg-gray-50 rounded-md'>
                  <div className='flex items-center space-x-2'>
                    <FileText className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {selectedFile.name}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                PDF Password (Optional)
              </label>
              <div className='relative'>
                <input
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='Enter password if PDF is protected'
                  className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                />
                <Lock className='absolute right-3 top-2.5 w-4 h-4 text-gray-400' />
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                Common passwords: Last 4 digits of card, DOB (DDMMYYYY), or PAN
                last 4 digits
              </p>
            </div>

            {/* Test Button */}
            <Button
              onClick={handleTest}
              disabled={!selectedFile || isTesting}
              className='w-full'
            >
              {isTesting ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  Testing PDF...
                </>
              ) : (
                <>
                  <Upload className='w-4 h-4 mr-2' />
                  Test PDF Parsing
                </>
              )}
            </Button>

            {/* Results */}
            {result && (
              <div className='mt-6 p-4 bg-gray-50 rounded-md'>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>
                  Test Results
                </h3>

                <div className='space-y-3'>
                  <div className='flex items-center space-x-2'>
                    {result.success ? (
                      <Unlock className='w-5 h-5 text-green-500' />
                    ) : (
                      <Lock className='w-5 h-5 text-red-500' />
                    )}
                    <span
                      className={`font-medium ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {result.success ? 'Parsing Successful' : 'Parsing Failed'}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='font-medium'>Transactions:</span>{' '}
                      {result.transactionCount}
                    </div>
                    <div>
                      <span className='font-medium'>Card Number:</span>{' '}
                      {result.metadataFields.cardNumber ? '✓' : '✗'}
                    </div>
                    <div>
                      <span className='font-medium'>Statement Date:</span>{' '}
                      {result.metadataFields.statementDate ? '✓' : '✗'}
                    </div>
                    <div>
                      <span className='font-medium'>Total Due:</span>{' '}
                      {result.metadataFields.totalDue ? '✓' : '✗'}
                    </div>
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <div>
                      <span className='font-medium text-red-700'>Errors:</span>
                      <ul className='mt-1 text-sm text-red-600'>
                        {result.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.warnings && result.warnings.length > 0 && (
                    <div>
                      <span className='font-medium text-yellow-700'>
                        Warnings:
                      </span>
                      <ul className='mt-1 text-sm text-yellow-600'>
                        {result.warnings.map(
                          (warning: string, index: number) => (
                            <li key={index}>• {warning}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {result.rawTextPreview && (
                    <div>
                      <span className='font-medium'>Raw Text Preview:</span>
                      <pre className='mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32'>
                        {result.rawTextPreview}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
