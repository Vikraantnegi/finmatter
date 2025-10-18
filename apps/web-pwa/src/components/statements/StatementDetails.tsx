'use client';

import { useState, useEffect } from 'react';
import {
  Statement,
  EMILoan,
  statementService,
} from '@/services/statementService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CreditCard,
  Gift,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  PieChart,
  BarChart3,
} from 'lucide-react';

interface StatementDetailsProps {
  statement: Statement;
}

export function StatementDetails({ statement }: StatementDetailsProps) {
  const [emiLoans, setEmiLoans] = useState<EMILoan[]>([]);
  const [loadingEMI, setLoadingEMI] = useState(false);

  useEffect(() => {
    if (statement.status === 'success' && statement.id) {
      setLoadingEMI(true);
      statementService
        .getStatementEMILoans(statement.id)
        .then(setEmiLoans)
        .catch(console.error)
        .finally(() => setLoadingEMI(false));
    }
  }, [statement.id, statement.status]);

  const getStatusIcon = () => {
    switch (statement.status) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'processing':
        return <Clock className='w-5 h-5 text-yellow-500' />;
      case 'failed':
        return <XCircle className='w-5 h-5 text-red-500' />;
      default:
        return <Clock className='w-5 h-5 text-gray-500' />;
    }
  };

  const getStatusColor = () => {
    switch (statement.status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Statement Header */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            {getStatusIcon()}
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {statement.fileName}
              </h2>
              <p className='text-sm text-gray-500'>
                Uploaded: {formatDate(statement.uploadedAt)}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
          >
            {statement.status}
          </div>
        </div>

        {statement.status === 'success' && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {statement.transactionCount || 0}
              </div>
              <div className='text-sm text-gray-500'>Transactions</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {statement.emiCount || 0}
              </div>
              <div className='text-sm text-gray-500'>EMI Loans</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {formatCurrency(statement.totalSpends || 0)}
              </div>
              <div className='text-sm text-gray-500'>Total Spends</div>
            </div>
          </div>
        )}
      </div>

      {/* Statement Summary */}
      {statement.status === 'success' && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Financial Summary */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center space-x-2 mb-4'>
              <DollarSign className='w-5 h-5 text-primary-500' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Financial Summary
              </h3>
            </div>

            <div className='space-y-3'>
              {statement.previousBalance && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Previous Balance</span>
                  <span className='font-medium'>
                    {formatCurrency(statement.previousBalance)}
                  </span>
                </div>
              )}
              {statement.purchasesCharges && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Purchases & Charges</span>
                  <span className='font-medium'>
                    {formatCurrency(statement.purchasesCharges)}
                  </span>
                </div>
              )}
              {statement.paymentsCredits && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Payments & Credits</span>
                  <span className='font-medium text-green-600'>
                    {formatCurrency(statement.paymentsCredits)}
                  </span>
                </div>
              )}
              {statement.cashAdvances && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Cash Advances</span>
                  <span className='font-medium'>
                    {formatCurrency(statement.cashAdvances)}
                  </span>
                </div>
              )}
              {statement.interestCharges && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Interest Charges</span>
                  <span className='font-medium text-red-600'>
                    {formatCurrency(statement.interestCharges)}
                  </span>
                </div>
              )}
              {statement.latePaymentFee && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Late Payment Fee</span>
                  <span className='font-medium text-red-600'>
                    {formatCurrency(statement.latePaymentFee)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spending Breakdown */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center space-x-2 mb-4'>
              <PieChart className='w-5 h-5 text-primary-500' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Spending Breakdown
              </h3>
            </div>

            <div className='space-y-3'>
              {statement.domesticSpends && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Domestic Spends</span>
                  <span className='font-medium'>
                    {formatCurrency(statement.domesticSpends)}
                  </span>
                </div>
              )}
              {statement.internationalSpends && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>International Spends</span>
                  <span className='font-medium'>
                    {formatCurrency(statement.internationalSpends)}
                  </span>
                </div>
              )}
              {statement.atmWithdrawals && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>ATM Withdrawals</span>
                  <span className='font-medium'>
                    {formatCurrency(statement.atmWithdrawals)}
                  </span>
                </div>
              )}
              {statement.numberOfTransactions && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Total Transactions</span>
                  <span className='font-medium'>
                    {statement.numberOfTransactions}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reward Points */}
      {statement.status === 'success' &&
        (statement.rewardPointsEarned || statement.rewardPointsClosing) && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center space-x-2 mb-4'>
              <Gift className='w-5 h-5 text-primary-500' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Reward Points
              </h3>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
              {statement.rewardPointsOpening && (
                <div className='text-center'>
                  <div className='text-xl font-bold text-gray-900'>
                    {statement.rewardPointsOpening.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-500'>Opening</div>
                </div>
              )}
              {statement.rewardPointsEarned && (
                <div className='text-center'>
                  <div className='text-xl font-bold text-green-600'>
                    +{statement.rewardPointsEarned.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-500'>Earned</div>
                </div>
              )}
              {statement.rewardPointsRedeemed && (
                <div className='text-center'>
                  <div className='text-xl font-bold text-blue-600'>
                    -{statement.rewardPointsRedeemed.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-500'>Redeemed</div>
                </div>
              )}
              {statement.rewardPointsExpired && (
                <div className='text-center'>
                  <div className='text-xl font-bold text-red-600'>
                    -{statement.rewardPointsExpired.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-500'>Expired</div>
                </div>
              )}
              {statement.rewardPointsClosing && (
                <div className='text-center'>
                  <div className='text-xl font-bold text-gray-900'>
                    {statement.rewardPointsClosing.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-500'>Closing</div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* EMI Loans */}
      {statement.status === 'success' && (statement.emiCount || 0) > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <CreditCard className='w-5 h-5 text-primary-500' />
            <h3 className='text-lg font-semibold text-gray-900'>EMI Loans</h3>
          </div>

          {loadingEMI ? (
            <div className='flex items-center justify-center py-8'>
              <LoadingSpinner size='md' />
            </div>
          ) : emiLoans.length > 0 ? (
            <div className='space-y-3'>
              {emiLoans.map(loan => (
                <div
                  key={loan.id}
                  className='border border-gray-200 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-medium text-gray-900'>
                      {loan.product_description || `Loan ${loan.loan_number}`}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {loan.remaining_tenure} months remaining
                    </div>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div>
                      <div className='text-gray-500'>Principal</div>
                      <div className='font-medium'>
                        {formatCurrency(loan.principal_amount)}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500'>EMI Amount</div>
                      <div className='font-medium'>
                        {formatCurrency(loan.emi_amount)}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Interest Rate</div>
                      <div className='font-medium'>
                        {loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-500'>Start Date</div>
                      <div className='font-medium'>
                        {loan.start_date ? formatDate(loan.start_date) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <CreditCard className='w-12 h-12 mx-auto mb-3 text-gray-300' />
              <p>No EMI loans found</p>
            </div>
          )}
        </div>
      )}

      {/* Category-wise Spending */}
      {statement.status === 'success' &&
        statement.categoryWiseSpends &&
        Object.keys(statement.categoryWiseSpends).length > 0 && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center space-x-2 mb-4'>
              <BarChart3 className='w-5 h-5 text-primary-500' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Category-wise Spending
              </h3>
            </div>

            <div className='space-y-3'>
              {Object.entries(statement.categoryWiseSpends).map(
                ([category, amount]) => (
                  <div
                    key={category}
                    className='flex items-center justify-between'
                  >
                    <span className='text-gray-600 capitalize'>
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {/* Validation Warnings */}
      {statement.validationWarnings && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-6'>
          <div className='flex items-center space-x-2 mb-2'>
            <AlertCircle className='w-5 h-5 text-yellow-600' />
            <h3 className='text-lg font-semibold text-yellow-800'>
              Validation Warnings
            </h3>
          </div>
          <p className='text-yellow-700'>{statement.validationWarnings}</p>
        </div>
      )}

      {/* Error Message */}
      {statement.status === 'failed' && statement.parsingError && (
        <div className='bg-red-50 border border-red-200 rounded-xl p-6'>
          <div className='flex items-center space-x-2 mb-2'>
            <XCircle className='w-5 h-5 text-red-600' />
            <h3 className='text-lg font-semibold text-red-800'>
              Processing Error
            </h3>
          </div>
          <p className='text-red-700'>{statement.parsingError}</p>
        </div>
      )}
    </div>
  );
}
