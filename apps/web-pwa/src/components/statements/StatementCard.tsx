'use client';

import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { formatFileSize } from '@finmatter/shared';
import type { Statement } from '@/services/statementService';

interface StatementCardProps {
  statement: Statement;
  onDelete?: (id: string) => void;
}

export function StatementCard({ statement, onDelete }: StatementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusIcon = () => {
    switch (statement.status) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'failed':
        return <XCircle className='w-5 h-5 text-red-600' />;
      case 'processing':
        return <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />;
      default:
        return <Clock className='w-5 h-5 text-gray-400' />;
    }
  };

  const getStatusText = () => {
    switch (statement.status) {
      case 'success':
        return 'Parsed successfully';
      case 'failed':
        return 'Parsing failed';
      case 'processing':
        return 'Parsing...';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = () => {
    switch (statement.status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this statement?')) return;

    setIsDeleting(true);
    try {
      await onDelete(statement.id);
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-3 flex-1 min-w-0'>
          <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0'>
            <FileText className='w-5 h-5 text-gray-600' />
          </div>

          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-gray-900 truncate'>
              {statement.fileName}
            </p>
            {statement.card && (
              <p className='text-xs text-gray-600 mt-1'>
                {statement.card.bankName} •••• {statement.card.lastFourDigits}
              </p>
            )}
            <div className='flex items-center space-x-4 mt-2'>
              <span className='text-xs text-gray-500'>
                {formatFileSize(statement.fileSize)}
              </span>
              <span className='text-xs text-gray-500'>
                {format(new Date(statement.uploadedAt), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className='text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50'
            title='Delete statement'
          >
            {isDeleting ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Trash2 className='w-5 h-5' />
            )}
          </button>
        )}
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor()}`}
        >
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>

        {statement.status === 'success' &&
          statement.transactionCount !== undefined && (
            <span className='text-sm text-gray-600'>
              {statement.transactionCount} transaction
              {statement.transactionCount !== 1 ? 's' : ''}
            </span>
          )}

        {statement.status === 'failed' && statement.parsingError && (
          <span className='text-xs text-red-600 truncate max-w-xs'>
            {statement.parsingError}
          </span>
        )}
      </div>

      {statement.status === 'success' && (
        <div className='mt-4 pt-4 border-t border-gray-100'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
            {statement.dueDate && (
              <div>
                <p className='text-xs text-gray-500'>Due Date</p>
                <p className='text-sm font-medium text-gray-900 mt-1'>
                  {format(new Date(statement.dueDate), 'MMM dd')}
                </p>
              </div>
            )}
            {statement.minimumPayment && (
              <div>
                <p className='text-xs text-gray-500'>Min Payment</p>
                <p className='text-sm font-medium text-gray-900 mt-1'>
                  ₹{statement.minimumPayment.toLocaleString()}
                </p>
              </div>
            )}
            {statement.totalSpends && (
              <div>
                <p className='text-xs text-gray-500'>Total Spends</p>
                <p className='text-sm font-medium text-gray-900 mt-1'>
                  ₹{statement.totalSpends.toLocaleString()}
                </p>
              </div>
            )}
            {statement.emiCount && statement.emiCount > 0 && (
              <div>
                <p className='text-xs text-gray-500'>EMI Loans</p>
                <p className='text-sm font-medium text-gray-900 mt-1'>
                  {statement.emiCount}
                </p>
              </div>
            )}
            {statement.rewardPointsEarned && (
              <div>
                <p className='text-xs text-gray-500'>Points Earned</p>
                <p className='text-sm font-medium text-green-600 mt-1'>
                  +{statement.rewardPointsEarned.toLocaleString()}
                </p>
              </div>
            )}
            {statement.creditLimit && (
              <div>
                <p className='text-xs text-gray-500'>Credit Limit</p>
                <p className='text-sm font-medium text-gray-900 mt-1'>
                  ₹{statement.creditLimit.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
