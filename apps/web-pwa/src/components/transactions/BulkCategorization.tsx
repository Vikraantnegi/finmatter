/**
 * Bulk Categorization Component
 * Allows users to categorize multiple transactions at once
 */

'use client';

import React, { useState } from 'react';
import { Transaction } from '@finmatter/types';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUpdateTransactionCategory } from '@/hooks/useTransactions';
import { formatCurrency } from '@finmatter/shared';
import { Check, X, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkCategorizationProps {
  transactions: Transaction[];
  onComplete?: () => void;
  className?: string;
}

export function BulkCategorization({
  transactions,
  onComplete,
  className = '',
}: BulkCategorizationProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(),
  );
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSubcategory, setBulkSubcategory] = useState('');
  const [updating, setUpdating] = useState(false);
  const [individualEdits, setIndividualEdits] = useState<
    Record<string, { category: string; subcategory: string }>
  >({});

  const { updateCategory } = useUpdateTransactionCategory();

  // Group transactions by merchant for easier categorization
  const merchantGroups = transactions.reduce(
    (acc, t) => {
      const merchant = t.merchantName;
      if (!acc[merchant]) {
        acc[merchant] = [];
      }
      acc[merchant].push(t);
      return acc;
    },
    {} as Record<string, Transaction[]>,
  );

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategory || selectedTransactions.size === 0) {
      toast.error('Please select a category and transactions');
      return;
    }

    setUpdating(true);
    try {
      const promises = Array.from(selectedTransactions).map(transactionId =>
        updateCategory(transactionId, bulkCategory, bulkSubcategory),
      );

      await Promise.all(promises);

      toast.success(`Updated ${selectedTransactions.size} transactions`);
      setSelectedTransactions(new Set());
      setBulkCategory('');
      setBulkSubcategory('');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to update transactions');
    } finally {
      setUpdating(false);
    }
  };

  const handleIndividualEdit = (
    transactionId: string,
    category: string,
    subcategory: string,
  ) => {
    setIndividualEdits(prev => ({
      ...prev,
      [transactionId]: { category, subcategory },
    }));
  };

  const handleIndividualUpdate = async (transactionId: string) => {
    const edit = individualEdits[transactionId];
    if (!edit) return;

    setUpdating(true);
    try {
      await updateCategory(transactionId, edit.category, edit.subcategory);
      toast.success('Transaction updated');

      // Remove from individual edits
      const newEdits = { ...individualEdits };
      delete newEdits[transactionId];
      setIndividualEdits(newEdits);
    } catch (error) {
      toast.error('Failed to update transaction');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Categorize Transactions
            </h3>
            <p className='text-sm text-gray-600'>
              {transactions.length} transactions need categorization
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm' onClick={handleSelectAll}>
              {selectedTransactions.size === transactions.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.size > 0 && (
        <div className='p-6 border-b border-gray-200 bg-blue-50'>
          <div className='flex items-center space-x-4'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Bulk Category ({selectedTransactions.size} selected)
              </label>
              <div className='flex space-x-2'>
                <select
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select Category</option>
                  <option value='dining'>Dining</option>
                  <option value='shopping'>Shopping</option>
                  <option value='groceries'>Groceries</option>
                  <option value='fuel'>Fuel</option>
                  <option value='travel'>Travel</option>
                  <option value='entertainment'>Entertainment</option>
                  <option value='bills'>Bills</option>
                  <option value='healthcare'>Healthcare</option>
                  <option value='education'>Education</option>
                  <option value='transport'>Transport</option>
                  <option value='utilities'>Utilities</option>
                  <option value='insurance'>Insurance</option>
                  <option value='investment'>Investment</option>
                  <option value='others'>Others</option>
                </select>
                <input
                  type='text'
                  value={bulkSubcategory}
                  onChange={e => setBulkSubcategory(e.target.value)}
                  placeholder='Subcategory (optional)'
                  className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <Button
                  onClick={handleBulkUpdate}
                  disabled={updating || !bulkCategory}
                  className='flex items-center space-x-2'
                >
                  {updating && <LoadingSpinner size='sm' />}
                  <span>Apply to Selected</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className='divide-y divide-gray-200'>
        {Object.entries(merchantGroups).map(
          ([merchant, merchantTransactions]) => (
            <div key={merchant} className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <h4 className='font-medium text-gray-900'>{merchant}</h4>
                  <span className='text-sm text-gray-500'>
                    {merchantTransactions.length} transaction
                    {merchantTransactions.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-gray-900'>
                    {formatCurrency(
                      merchantTransactions.reduce(
                        (sum, t) => sum + t.amount,
                        0,
                      ),
                      'INR',
                    )}
                  </p>
                </div>
              </div>

              <div className='space-y-3'>
                {merchantTransactions.map(transaction => {
                  const isSelected = selectedTransactions.has(transaction.id);
                  const isEditing = individualEdits[transaction.id];

                  return (
                    <div
                      key={transaction.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => handleSelectTransaction(transaction.id)}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />

                      <CategoryIcon category={transaction.category} size='sm' />

                      <div className='flex-1'>
                        <div className='flex items-center space-x-2'>
                          <span className='text-sm font-medium text-gray-900'>
                            {formatCurrency(
                              transaction.amount,
                              transaction.currency,
                            )}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <span className='text-xs text-gray-600 capitalize'>
                            {transaction.category}
                          </span>
                          {transaction.subcategory && (
                            <>
                              <span className='text-gray-400'>•</span>
                              <span className='text-xs text-gray-500'>
                                {transaction.subcategory}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className='flex items-center space-x-2'>
                          <select
                            value={isEditing.category}
                            onChange={e =>
                              handleIndividualEdit(
                                transaction.id,
                                e.target.value,
                                isEditing.subcategory,
                              )
                            }
                            className='text-xs border border-gray-300 rounded px-2 py-1'
                          >
                            <option value='dining'>Dining</option>
                            <option value='shopping'>Shopping</option>
                            <option value='groceries'>Groceries</option>
                            <option value='fuel'>Fuel</option>
                            <option value='travel'>Travel</option>
                            <option value='entertainment'>Entertainment</option>
                            <option value='bills'>Bills</option>
                            <option value='healthcare'>Healthcare</option>
                            <option value='education'>Education</option>
                            <option value='transport'>Transport</option>
                            <option value='utilities'>Utilities</option>
                            <option value='insurance'>Insurance</option>
                            <option value='investment'>Investment</option>
                            <option value='others'>Others</option>
                          </select>
                          <Button
                            size='sm'
                            onClick={() =>
                              handleIndividualUpdate(transaction.id)
                            }
                            disabled={updating}
                            className='p-1'
                          >
                            <Check className='w-3 h-3' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              const newEdits = { ...individualEdits };
                              delete newEdits[transaction.id];
                              setIndividualEdits(newEdits);
                            }}
                            className='p-1'
                          >
                            <X className='w-3 h-3' />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleIndividualEdit(
                              transaction.id,
                              transaction.category,
                              transaction.subcategory || '',
                            )
                          }
                          className='p-1'
                        >
                          <Edit3 className='w-3 h-3' />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
