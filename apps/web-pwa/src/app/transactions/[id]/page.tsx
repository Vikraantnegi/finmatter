'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
  getTransactionTypeLabel,
} from '@finmatter/shared';
import type { Transaction } from '@finmatter/types';
import { toast } from 'react-hot-toast';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategory, setEditedCategory] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: { transaction: Transaction };
      }>(`/api/transactions/${transactionId}`);

      if (response.success && response.data.transaction) {
        const txn = response.data.transaction;
        setTransaction(txn);
        setEditedCategory(txn.category || '');
        setEditedNotes(txn.notes || '');
      } else {
        toast.error('Transaction not found');
        router.back();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load transaction';
      toast.error(errorMessage);
      console.error('Error fetching transaction:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!transaction) return;

    try {
      setIsSaving(true);
      const response = await apiClient.patch<{
        success: boolean;
        data: { transaction: Transaction };
      }>(`/api/transactions/${transactionId}`, {
        category: editedCategory || null,
        notes: editedNotes || null,
      });

      if (response.success && response.data.transaction) {
        setTransaction(response.data.transaction);
        setIsEditing(false);
        toast.success('Transaction updated successfully');
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update transaction';
      toast.error(errorMessage);
      console.error('Error updating transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (transaction) {
      setEditedCategory(transaction.category || '');
      setEditedNotes(transaction.notes || '');
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center px-6'>
        <EmptyState
          icon={<FileText className='w-12 h-12 text-gray-400' />}
          title='Transaction not found'
          description='This transaction does not exist or you do not have access to it.'
        />
      </div>
    );
  }

  const cardInfo = transaction.cards
    ? `${transaction.cards.card_name || 'Card'} •••• ${transaction.cards.last_four_digits}`
    : null;

  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-6 border-b border-gray-800'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back</span>
        </button>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-white'>Transaction Details</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className='flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors'
            >
              <Edit2 className='w-4 h-4' />
              <span>Edit</span>
            </button>
          ) : (
            <div className='flex items-center gap-2'>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className='flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50'
              >
                <X className='w-4 h-4' />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className='flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50'
              >
                <Save className='w-4 h-4' />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details */}
      <div className='flex-1 px-6 py-6 space-y-4'>
        {/* Merchant & Amount Card */}
        <div className='bg-gray-800 rounded-2xl p-6 border border-gray-700'>
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1'>
              <h2 className='text-2xl font-bold text-white mb-2'>
                {transaction.merchant_name}
              </h2>
              {transaction.merchant_category && (
                <p className='text-sm text-gray-400'>
                  {transaction.merchant_category}
                </p>
              )}
            </div>
            <div className='text-right'>
              <div
                className={`text-3xl font-bold ${
                  transaction.type === 'debit'
                    ? 'text-red-400'
                    : transaction.type === 'credit' ||
                        transaction.type === 'refund'
                      ? 'text-green-400'
                      : 'text-white'
                }`}
              >
                {transaction.type === 'debit' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </div>
              <div className='text-sm text-gray-400 mt-1'>
                {transaction.currency}
              </div>
              <div
                className={`text-xs font-medium mt-2 ${getTransactionTypeColor(transaction.type)}`}
              >
                {getTransactionTypeLabel(transaction.type)}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Transaction Information
          </h3>

          {/* Date */}
          <div className='flex items-center justify-between py-2'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-gray-400' />
              <span className='text-sm text-gray-400'>Transaction Date</span>
            </div>
            <span className='text-sm font-medium text-white'>
              {formatDate(transaction.transaction_date, 'MMM dd, yyyy')}
            </span>
          </div>

          {transaction.posting_date && (
            <div className='flex items-center justify-between py-2'>
              <div className='flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-gray-400' />
                <span className='text-sm text-gray-400'>Posting Date</span>
              </div>
              <span className='text-sm font-medium text-white'>
                {formatDate(transaction.posting_date, 'MMM dd, yyyy')}
              </span>
            </div>
          )}

          {/* Category */}
          <div className='flex items-center justify-between py-2 border-t border-gray-700'>
            <div className='flex items-center gap-2'>
              <Tag className='w-5 h-5 text-gray-400' />
              <span className='text-sm text-gray-400'>Category</span>
            </div>
            {isEditing ? (
              <input
                type='text'
                value={editedCategory}
                onChange={e => setEditedCategory(e.target.value)}
                placeholder='Enter category'
                className='px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary'
              />
            ) : (
              <span className='text-sm font-medium text-white'>
                {transaction.category || 'Uncategorized'}
              </span>
            )}
          </div>

          {/* Description */}
          {transaction.description && (
            <div className='py-2 border-t border-gray-700'>
              <div className='flex items-center gap-2 mb-2'>
                <FileText className='w-5 h-5 text-gray-400' />
                <span className='text-sm text-gray-400'>Description</span>
              </div>
              <p className='text-sm text-white'>{transaction.description}</p>
            </div>
          )}

          {/* Notes */}
          <div className='py-2 border-t border-gray-700'>
            <div className='flex items-center gap-2 mb-2'>
              <FileText className='w-5 h-5 text-gray-400' />
              <span className='text-sm text-gray-400'>Notes</span>
            </div>
            {isEditing ? (
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                placeholder='Add notes or remarks...'
                rows={3}
                className='w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none'
              />
            ) : (
              <p className='text-sm text-white'>
                {transaction.notes || 'No notes added'}
              </p>
            )}
          </div>
        </div>

        {/* Card Information */}
        {cardInfo && (
          <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Card Information
            </h3>
            <div className='flex items-center gap-2'>
              <CreditCard className='w-5 h-5 text-gray-400' />
              <span className='text-sm text-white'>{cardInfo}</span>
            </div>
            {transaction.cards?.bank_name && (
              <div className='text-xs text-gray-400 mt-2 ml-7'>
                {transaction.cards.bank_name.toUpperCase()} Bank
              </div>
            )}
          </div>
        )}

        {/* Statement Information */}
        {transaction.statements && (
          <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Statement Information
            </h3>
            <div className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-gray-400' />
              <span className='text-sm text-white'>
                {transaction.statements.file_name}
              </span>
            </div>
            <div className='text-xs text-gray-400 mt-2 ml-7'>
              Uploaded:{' '}
              {formatDate(transaction.statements.upload_date, 'MMM dd, yyyy')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
