'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Tag, CreditCard, Save, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
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

  const fetchTransaction = useCallback(async () => {
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
  }, [transactionId, router]);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId, fetchTransaction]);

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

  // Format date and time
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDate(date, 'dd MMMM yyyy, hh:mm a');
    } catch {
      return dateString;
    }
  };

  // Get merchant icon color
  const getMerchantIconColor = (merchantName: string): string => {
    const colors = [
      'bg-orange-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-red-500',
      'bg-blue-500',
      'bg-teal-500',
      'bg-pink-500',
      'bg-yellow-500',
    ];
    const hash = merchantName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Get merchant icon (first letter)
  const getMerchantIcon = (merchantName: string): string => {
    return merchantName.charAt(0).toUpperCase();
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
          icon={<CreditCard className='w-12 h-12 text-gray-400' />}
          title='Transaction not found'
          description='This transaction does not exist or you do not have access to it.'
        />
      </div>
    );
  }

  const cardInfo = transaction.cards
    ? `${transaction.cards.card_name || 'Card'} •••• ${transaction.cards.last_four_digits}`
    : null;

  const transactionTypeColor = getTransactionTypeColor(transaction.type);

  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-800'>
        <div className='flex items-center justify-between'>
          <button
            onClick={() => router.back()}
            className='text-gray-400 hover:text-white transition-colors flex-shrink-0'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <h1 className='text-xl font-bold text-white flex-1 text-center'>
            Transaction Detail
          </h1>
          <div className='flex-shrink-0 w-16 flex justify-end'>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className='text-white hover:text-primary transition-colors text-sm font-medium'
              >
                Edit
              </button>
            ) : (
              <div className='flex items-center gap-3'>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className='text-gray-400 hover:text-white transition-colors text-sm font-medium disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className='text-primary hover:text-primary/80 transition-colors text-sm font-medium disabled:opacity-50'
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className='flex-1 px-6 py-6 space-y-6'>
        {/* Merchant & Amount Summary */}
        <div className='flex flex-col items-center text-center space-y-4'>
          {/* Merchant Icon */}
          <div
            className={`w-20 h-20 rounded-full ${getMerchantIconColor(
              transaction.merchant_name,
            )} flex items-center justify-center text-white font-bold text-2xl border-4 border-primary/30`}
          >
            {getMerchantIcon(transaction.merchant_name)}
          </div>

          {/* Merchant Name */}
          <div>
            <h2 className='text-2xl font-bold text-white mb-2'>
              {transaction.merchant_name}
            </h2>
            <p className='text-sm text-gray-400'>
              {formatDateTime(transaction.transaction_date)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <div className={`text-4xl font-bold mb-2 ${transactionTypeColor}`}>
              {transaction.type === 'debit' ? '-' : '+'}
              {formatCurrency(transaction.amount)}
            </div>
            {!transaction.category && (
              <div className='inline-flex items-center px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/30'>
                <span className='text-xs font-medium text-gray-400'>
                  Untagged
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Details Card */}
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4'>
          {/* Category */}
          <button
            onClick={() => {
              if (isEditing) {
                // TODO: Open category picker (Phase 2 - Transaction categorization)
                toast('Category picker coming soon', { icon: 'ℹ️' });
              }
            }}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
              isEditing
                ? 'bg-gray-900 border-gray-600 hover:border-primary cursor-pointer'
                : 'bg-gray-900 border-gray-700'
            }`}
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center'>
                <Tag className='w-5 h-5 text-primary' />
              </div>
              <div className='text-left'>
                <div className='text-xs text-gray-400 mb-1'>Category</div>
                {isEditing ? (
                  <input
                    type='text'
                    value={editedCategory}
                    onChange={e => setEditedCategory(e.target.value)}
                    placeholder='Enter category'
                    className='text-sm font-medium text-white bg-transparent border-none outline-none w-full'
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <div className='text-sm font-medium text-white'>
                    {transaction.category || 'Uncategorized'}
                  </div>
                )}
              </div>
            </div>
            {isEditing && <ChevronRight className='w-5 h-5 text-gray-400' />}
          </button>

          {/* Payment Card (Read-only) */}
          {cardInfo && (
            <div className='w-full flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-700'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center'>
                  <CreditCard className='w-5 h-5 text-primary' />
                </div>
                <div className='text-left'>
                  <div className='text-xs text-gray-400 mb-1'>Payment Card</div>
                  <div className='text-sm font-medium text-white'>
                    {cardInfo}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className='w-full p-4 rounded-xl bg-gray-900 border border-gray-700'>
            <div className='text-xs text-gray-400 mb-2'>Add a note</div>
            {isEditing ? (
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                placeholder='Add a note...'
                rows={3}
                className='w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 resize-none'
              />
            ) : (
              <p className='text-sm text-white'>
                {transaction.notes || 'Add a note...'}
              </p>
            )}
          </div>
        </div>

        {/* Save Changes Button (only when editing) */}
        {isEditing && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className='w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {isSaving ? (
              <>
                <LoadingSpinner size='sm' className='text-white' />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className='w-5 h-5' />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
