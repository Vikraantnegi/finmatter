/**
 * Transaction Detail Page
 * Shows detailed information about a specific transaction
 */

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Transaction } from '@finmatter/types';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUpdateTransactionCategory } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@finmatter/shared';
import {
  ArrowLeft,
  Edit,
  CreditCard,
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');

  const { updateCategory } = useUpdateTransactionCategory();

  // Mock transaction data - in real app, this would come from API
  const transaction: Transaction = {
    id: transactionId,
    userId: 'user-123',
    amount: 1250.0,
    currency: 'INR',
    type: 'debit',
    status: 'completed',
    merchantName: 'SWIGGY',
    description: 'Food delivery order',
    date: new Date('2024-01-15T19:30:00Z'),
    category: 'dining',
    subcategory: 'food_delivery',
    tags: ['food', 'delivery'],
    notes: 'Dinner order for family',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    },
    cardId: 'card-123',
    reference: 'TXN123456789',
    rewardPoints: 12,
    createdAt: new Date('2024-01-15T19:30:00Z'),
    updatedAt: new Date('2024-01-15T19:30:00Z'),
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditCategory = () => {
    setEditingCategory(true);
    setNewCategory(transaction.category);
    setNewSubcategory(transaction.subcategory || '');
  };

  const handleSaveCategory = async () => {
    try {
      setLoading(true);
      await updateCategory(transactionId, newCategory, newSubcategory);
      toast.success('Category updated successfully');
      setEditingCategory(false);
    } catch (error) {
      toast.error('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(false);
    setNewCategory(transaction.category);
    setNewSubcategory(transaction.subcategory || '');
  };

  const isDebit = transaction.type === 'debit';
  const amountColor = isDebit ? 'text-red-600' : 'text-green-600';
  const amountPrefix = isDebit ? '-' : '+';

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' onClick={handleBack} className='p-2'>
                <ArrowLeft className='w-5 h-5' />
              </Button>
              <h1 className='text-xl font-semibold text-gray-900'>
                Transaction Details
              </h1>
            </div>

            <Button
              variant='outline'
              onClick={handleEditCategory}
              className='flex items-center space-x-2'
            >
              <Edit className='w-4 h-4' />
              <span>Edit Category</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
          {/* Transaction Header */}
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center space-x-4'>
                <CategoryIcon category={transaction.category} size='lg' />
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    {transaction.merchantName}
                  </h2>
                  <div className='flex items-center space-x-2 mt-1'>
                    <span className='text-lg text-gray-600 capitalize'>
                      {transaction.category}
                    </span>
                    {transaction.subcategory && (
                      <>
                        <span className='text-gray-400'>•</span>
                        <span className='text-lg text-gray-500'>
                          {transaction.subcategory}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className='text-right'>
                <div className={`text-3xl font-bold ${amountColor}`}>
                  {amountPrefix}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </div>
                {transaction.rewardPoints && transaction.rewardPoints > 0 && (
                  <div className='text-sm text-green-600 mt-1'>
                    +{transaction.rewardPoints} reward points
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Left Column */}
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <Calendar className='w-5 h-5 text-gray-400' />
                  <div>
                    <div className='text-sm font-medium text-gray-900'>
                      Date
                    </div>
                    <div className='text-sm text-gray-600'>
                      {formatDate(
                        transaction.date,
                        'EEEE, MMMM d, yyyy h:mm a',
                      )}
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-3'>
                  <CreditCard className='w-5 h-5 text-gray-400' />
                  <div>
                    <div className='text-sm font-medium text-gray-900'>
                      Card
                    </div>
                    <div className='text-sm text-gray-600'>
                      Card ending {transaction.cardId?.slice(-4) || 'N/A'}
                    </div>
                  </div>
                </div>

                {transaction.location && (
                  <div className='flex items-center space-x-3'>
                    <MapPin className='w-5 h-5 text-gray-400' />
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        Location
                      </div>
                      <div className='text-sm text-gray-600'>
                        {transaction.location.city},{' '}
                        {transaction.location.state}
                      </div>
                    </div>
                  </div>
                )}

                {transaction.reference && (
                  <div className='flex items-center space-x-3'>
                    <Tag className='w-5 h-5 text-gray-400' />
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        Reference
                      </div>
                      <div className='text-sm text-gray-600 font-mono'>
                        {transaction.reference}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className='space-y-4'>
                <div>
                  <div className='text-sm font-medium text-gray-900 mb-2'>
                    Description
                  </div>
                  <div className='text-sm text-gray-600'>
                    {transaction.description || 'No description provided'}
                  </div>
                </div>

                {transaction.notes && (
                  <div>
                    <div className='text-sm font-medium text-gray-900 mb-2'>
                      Notes
                    </div>
                    <div className='text-sm text-gray-600'>
                      {transaction.notes}
                    </div>
                  </div>
                )}

                {transaction.tags && transaction.tags.length > 0 && (
                  <div>
                    <div className='text-sm font-medium text-gray-900 mb-2'>
                      Tags
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {transaction.tags.map((tag, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Edit Section */}
          {editingCategory && (
            <div className='p-6 border-t border-gray-200 bg-gray-50'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Edit Category
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
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
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subcategory
                  </label>
                  <input
                    type='text'
                    value={newSubcategory}
                    onChange={e => setNewSubcategory(e.target.value)}
                    placeholder='Optional subcategory'
                    className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              <div className='flex items-center space-x-3 mt-4'>
                <Button
                  onClick={handleSaveCategory}
                  disabled={loading}
                  className='flex items-center space-x-2'
                >
                  {loading && <LoadingSpinner size='sm' />}
                  <span>Save Changes</span>
                </Button>

                <Button
                  variant='outline'
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
