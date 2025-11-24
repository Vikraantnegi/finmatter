'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Calendar, Tag } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  transaction_date: string;
  posting_date: string | null;
  merchant_name: string;
  merchant_category: string | null;
  amount: number;
  type: 'debit' | 'credit' | 'refund';
  currency: string;
  description: string | null;
  category: string | null;
  notes: string | null;
  cards?: {
    id: string;
    last_four_digits: string;
    card_name: string | null;
  };
}

export default function StatementTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const statementId = params.id as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (statementId) {
      fetchTransactions();
    }
  }, [statementId]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: { transactions: Transaction[] };
      }>(`/api/statements/${statementId}/transactions`);

      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error: any) {
      toast.error('Failed to load transactions');
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'debit':
        return 'text-red-400';
      case 'credit':
        return 'text-green-400';
      case 'refund':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'debit':
        return 'Debit';
      case 'credit':
        return 'Credit';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

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
        <h1 className='text-2xl font-bold text-white'>Transactions</h1>
        <p className='text-sm text-gray-400 mt-1'>
          {transactions.length} transaction
          {transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className='flex-1 flex items-center justify-center px-6'>
          <EmptyState
            icon={<CreditCard className='w-12 h-12 text-gray-400' />}
            title='No transactions found'
            description='This statement does not contain any transactions'
          />
        </div>
      ) : (
        <div className='flex-1 px-6 py-4 space-y-3'>
          {transactions.map(transaction => (
            <div
              key={transaction.id}
              className='bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors'
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1'>
                  <h3 className='text-base font-semibold text-white mb-1'>
                    {transaction.merchant_name}
                  </h3>

                  <div className='flex items-center gap-3 text-sm text-gray-400 mb-2'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-3 h-3' />
                      <span>
                        {format(
                          new Date(transaction.transaction_date),
                          'MMM dd, yyyy',
                        )}
                      </span>
                    </div>

                    {transaction.category && (
                      <div className='flex items-center gap-1'>
                        <Tag className='w-3 h-3' />
                        <span>{transaction.category}</span>
                      </div>
                    )}

                    <span
                      className={`text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}
                    >
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>

                  {transaction.description && (
                    <p className='text-xs text-gray-500 mb-2'>
                      {transaction.description}
                    </p>
                  )}
                </div>

                <div className='text-right'>
                  <div
                    className={`text-lg font-bold ${
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
                  <div className='text-xs text-gray-500 mt-1'>
                    {transaction.currency}
                  </div>
                </div>
              </div>

              {transaction.cards && (
                <div className='pt-2 border-t border-gray-700'>
                  <div className='text-xs text-gray-400'>
                    Card ending in {transaction.cards.last_four_digits}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
