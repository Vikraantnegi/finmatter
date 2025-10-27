'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

type BankName =
  | 'hdfc'
  | 'icici'
  | 'sbi'
  | 'axis'
  | 'kotak'
  | 'citi'
  | 'amex'
  | 'hsbc';

const BANK_OPTIONS = [
  { value: 'hdfc', label: 'HDFC Bank' },
  { value: 'icici', label: 'ICICI Bank' },
  { value: 'sbi', label: 'State Bank of India' },
  { value: 'axis', label: 'Axis Bank' },
  { value: 'kotak', label: 'Kotak Mahindra Bank' },
  { value: 'citi', label: 'Citi Bank' },
  { value: 'amex', label: 'American Express' },
  { value: 'hsbc', label: 'HSBC' },
];

export default function DebugParsePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bankName, setBankName] = useState<BankName>('hdfc');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setSelectedFile(file);
    setParseResult(null);
  };

  const handleParse = async () => {
    if (!selectedFile) return;

    setIsParsing(true);
    setParseResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bankName', bankName);
      if (password) {
        formData.append('password', password);
      }

      const response = await apiClient.post<any>(
        '/api/statements/debug-parse',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.success) {
        setParseResult(response.data);
        toast.success('PDF parsed successfully!');
      } else {
        toast.error((response as any).error?.message || 'Failed to parse PDF');
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      toast.error(error.message || 'Failed to parse PDF');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Debug PDF Parser</h1>
          <p className='text-sm text-gray-600 mt-1'>
            Test PDF statement parsing without saving to database
          </p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Upload Section */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Upload Statement
            </h2>

            {/* Bank Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Select Bank
              </label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value as BankName)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white'
                disabled={isParsing}
              >
                {BANK_OPTIONS.map(bank => (
                  <option key={bank.value} value={bank.value}>
                    {bank.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
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
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 text-gray-900 bg-white placeholder-gray-400'
                  disabled={isParsing}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
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
                disabled={isParsing}
              />

              {!selectedFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className='w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-500 hover:bg-primary-50 transition-colors'
                >
                  <div className='flex flex-col items-center space-y-3'>
                    <Upload className='w-8 h-8 text-gray-400' />
                    <p className='text-sm font-medium text-gray-900'>
                      Click to upload PDF
                    </p>
                    <p className='text-xs text-gray-500'>
                      Maximum file size: 5MB
                    </p>
                  </div>
                </button>
              ) : (
                <div className='border border-gray-300 rounded-lg p-4'>
                  <div className='flex items-center space-x-3'>
                    <FileText className='w-8 h-8 text-gray-400' />
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-gray-900'>
                        {selectedFile.name}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Parse Button */}
            <Button
              onClick={handleParse}
              disabled={!selectedFile || isParsing}
              className='w-full'
            >
              {isParsing ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                  Parsing...
                </>
              ) : (
                'Parse PDF'
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Parse Results
            </h2>

            {!parseResult ? (
              <div className='text-center py-12 text-gray-500'>
                <FileText className='w-12 h-12 mx-auto mb-3 text-gray-300' />
                <p>Upload and parse a PDF to see results</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Status */}
                <div className='flex items-center space-x-2'>
                  {parseResult.parseResult.success ? (
                    <>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <span className='text-green-600 font-medium'>
                        Parsing Successful
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className='w-5 h-5 text-red-600' />
                      <span className='text-red-600 font-medium'>
                        Parsing Failed
                      </span>
                    </>
                  )}
                </div>

                {/* Debug Info */}
                <div className='bg-gray-50 rounded-lg p-4 space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Parse Time:</span>
                    <span className='font-medium'>
                      {parseResult.debugInfo.parseTimeMs}ms
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Transactions:</span>
                    <span className='font-medium'>
                      {parseResult.debugInfo.stats.transactionCount}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Errors:</span>
                    <span className='font-medium text-red-600'>
                      {parseResult.debugInfo.stats.errorCount}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Warnings:</span>
                    <span className='font-medium text-yellow-600'>
                      {parseResult.debugInfo.stats.warningCount}
                    </span>
                  </div>
                </div>

                {/* Raw Text */}
                {parseResult.parseResult.rawText && (
                  <div>
                    <h3 className='text-sm font-semibold text-gray-900 mb-2'>
                      Extracted Text (first 5000 chars)
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          parseResult.parseResult.rawText || '',
                        );
                        toast.success('Raw text copied!');
                      }}
                      className='text-sm text-primary-600 hover:text-primary-700 font-medium mb-2'
                    >
                      Copy Raw Text
                    </button>
                    <pre className='bg-blue-50 text-blue-900 rounded-lg p-4 text-xs overflow-auto max-h-[300px] border border-blue-200'>
                      {parseResult.parseResult.rawText}
                    </pre>
                  </div>
                )}

                {/* Full JSON */}
                <div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(parseResult, null, 2),
                      );
                      toast.success('Copied to clipboard!');
                    }}
                    className='text-sm text-primary-600 hover:text-primary-700 font-medium mb-2'
                  >
                    Copy Full JSON to Clipboard
                  </button>
                  <pre className='bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-[600px]'>
                    {JSON.stringify(parseResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
