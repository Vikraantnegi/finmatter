'use client';

import { format } from 'date-fns';
import {
  // Calendar,
  CreditCard,
  DollarSign,
  // TrendingUp,
  Award,
  PieChart,
  Building2,
  // Receipt,
} from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';

interface StatementMetadataProps {
  statement: {
    payment_due_date?: string | null;
    total_amount_due?: number | null;
    minimum_due?: number | null;
    statement_date?: string | null;
    billing_cycle_start?: string | null;
    billing_cycle_end?: string | null;
    reward_points_total?: number | null;
    reward_points_opening_balance?: number | null;
    reward_points_earned?: number | null;
    reward_points_disbursed?: number | null;
    reward_points_expiring_30_days?: number | null;
    reward_points_expiring_60_days?: number | null;
    spending_categories?: Array<{
      category: string;
      percentage: number;
    }> | null;
    rewards_program_summary?: Array<{ program: string; points: number }> | null;
    previous_statement_dues?: number | null;
    payments_credits_received?: number | null;
    purchases_debit?: number | null;
    finance_charges?: number | null;
    total_credit_limit?: number | null;
    available_credit_limit?: number | null;
    available_cash_limit?: number | null;
    emi_loans?: Array<{
      loanNumber: string;
      bookedDate: string;
      amount: number;
      tenure: string;
      rateOfInterest: number;
      balancePrincipal: number;
      outstandingBalance: number;
      interestPayable: number;
      balanceTenure: string;
    }> | null;
    gst_summary?: {
      igst: number;
      cgst: number;
      sgst: number;
      reversal: number;
      total: number;
    } | null;
  };
}

export function StatementMetadata({ statement }: StatementMetadataProps) {
  const hasPaymentInfo =
    statement.payment_due_date ||
    statement.total_amount_due !== null ||
    statement.minimum_due !== null;

  const hasRewardPoints =
    statement.reward_points_total !== null ||
    statement.reward_points_earned !== null;

  const hasFinancialSummary =
    statement.previous_statement_dues !== null ||
    statement.payments_credits_received !== null ||
    statement.purchases_debit !== null;

  const hasCreditLimits =
    statement.total_credit_limit !== null ||
    statement.available_credit_limit !== null;

  if (
    !hasPaymentInfo &&
    !hasRewardPoints &&
    !hasFinancialSummary &&
    !hasCreditLimits &&
    !statement.spending_categories &&
    !statement.rewards_program_summary &&
    !statement.emi_loans &&
    !statement.gst_summary
  ) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Section Heading */}
      <div className='flex items-center justify-between mb-2'>
        <h2 className='text-xl font-bold text-white'>
          Latest Statement Insights
        </h2>
      </div>

      {/* Payment Information */}
      {hasPaymentInfo && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <DollarSign className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-semibold text-white'>Payment Info</h2>
          </div>
          <div className='space-y-2'>
            {statement.payment_due_date && (
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-400'>Due Date</span>
                <span className='text-sm font-medium text-white'>
                  {format(new Date(statement.payment_due_date), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {statement.total_amount_due !== null &&
              statement.total_amount_due !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Total Amount Due
                  </span>
                  <span className='text-lg font-bold text-white'>
                    {formatCurrency(statement.total_amount_due)}
                  </span>
                </div>
              )}
            {statement.minimum_due !== null &&
              statement.minimum_due !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Minimum Due</span>
                  <span className='text-sm font-medium text-yellow-400'>
                    {formatCurrency(statement.minimum_due)}
                  </span>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Credit Limits */}
      {hasCreditLimits && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <CreditCard className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-semibold text-white'>Credit Limits</h2>
          </div>
          <div className='space-y-2'>
            {statement.total_credit_limit !== null &&
              statement.total_credit_limit !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Total Credit Limit
                  </span>
                  <span className='text-sm font-medium text-white'>
                    {formatCurrency(statement.total_credit_limit)}
                  </span>
                </div>
              )}
            {statement.available_credit_limit !== null &&
              statement.available_credit_limit !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Available Credit Limit
                  </span>
                  <span className='text-sm font-medium text-success-500'>
                    {formatCurrency(statement.available_credit_limit)}
                  </span>
                </div>
              )}
            {statement.available_cash_limit !== null &&
              statement.available_cash_limit !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Available Cash Limit
                  </span>
                  <span className='text-sm font-medium text-primary'>
                    {formatCurrency(statement.available_cash_limit)}
                  </span>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Billing Period */}
      {/* {(statement.billing_cycle_start || statement.billing_cycle_end) && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <Calendar className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-semibold text-white'>Billing Period</h2>
          </div>
          <div className='text-sm text-gray-300'>
            {statement.billing_cycle_start &&
              format(new Date(statement.billing_cycle_start), 'MMM dd, yyyy')}
            {statement.billing_cycle_start && statement.billing_cycle_end && (
              <span className='mx-2'>-</span>
            )}
            {statement.billing_cycle_end &&
              format(new Date(statement.billing_cycle_end), 'MMM dd, yyyy')}
          </div>
        </div>
      )} */}

      {/* Reward Points */}
      {hasRewardPoints && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <Award className='w-5 h-5 text-warning-500' />
            <h2 className='text-lg font-semibold text-white'>Reward Points</h2>
          </div>
          <div className='space-y-2'>
            {statement.reward_points_total !== null &&
              statement.reward_points_total !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Total Points</span>
                  <span className='text-lg font-bold text-warning-500'>
                    {statement.reward_points_total.toLocaleString()}
                  </span>
                </div>
              )}
            {statement.reward_points_earned !== null &&
              statement.reward_points_earned !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Earned This Period
                  </span>
                  <span className='text-sm font-medium text-success-500'>
                    +{statement.reward_points_earned.toLocaleString()}
                  </span>
                </div>
              )}
            {statement.reward_points_opening_balance !== null &&
              statement.reward_points_opening_balance !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Opening Balance</span>
                  <span className='text-sm text-gray-300'>
                    {statement.reward_points_opening_balance.toLocaleString()}
                  </span>
                </div>
              )}
            {((statement.reward_points_expiring_30_days !== null &&
              statement.reward_points_expiring_30_days !== undefined &&
              statement.reward_points_expiring_30_days > 0) ||
              (statement.reward_points_expiring_60_days !== null &&
                statement.reward_points_expiring_60_days !== undefined &&
                statement.reward_points_expiring_60_days > 0)) && (
              <div className='pt-2 border-t border-gray-700'>
                <div className='text-xs text-gray-400 mb-1'>
                  Points Expiring
                </div>
                {statement.reward_points_expiring_30_days !== null &&
                  statement.reward_points_expiring_30_days !== undefined &&
                  statement.reward_points_expiring_30_days > 0 && (
                    <div className='flex justify-between items-center text-xs'>
                      <span className='text-gray-400'>In 30 days</span>
                      <span className='text-orange-400'>
                        {statement.reward_points_expiring_30_days.toLocaleString()}
                      </span>
                    </div>
                  )}
                {statement.reward_points_expiring_60_days !== null &&
                  statement.reward_points_expiring_60_days !== undefined &&
                  statement.reward_points_expiring_60_days > 0 && (
                    <div className='flex justify-between items-center text-xs'>
                      <span className='text-gray-400'>In 60 days</span>
                      <span className='text-yellow-400'>
                        {statement.reward_points_expiring_60_days.toLocaleString()}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spending Categories */}
      {statement.spending_categories &&
        statement.spending_categories.length > 0 && (
          <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
            <div className='flex items-center gap-2 mb-3'>
              <PieChart className='w-5 h-5 text-primary' />
              <h2 className='text-lg font-semibold text-white'>
                Spending Categories
              </h2>
            </div>
            <div className='space-y-2'>
              {statement.spending_categories.map((cat, idx) => (
                <div key={idx} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-300'>{cat.category}</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-24 h-2 bg-gray-700 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-primary rounded-full'
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className='text-sm font-medium text-white w-12 text-right'>
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Rewards Program Summary */}
      {/* {statement.rewards_program_summary &&
        statement.rewards_program_summary.length > 0 && (
          <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
            <div className='flex items-center gap-2 mb-3'>
              <Award className='w-5 h-5 text-warning-500' />
              <h2 className='text-lg font-semibold text-white'>
                Rewards Program
              </h2>
            </div>
            <div className='space-y-2'>
              {statement.rewards_program_summary.map((program, idx) => (
                <div
                  key={idx}
                  className='flex justify-between items-center text-sm'
                >
                  <span className='text-gray-300 flex-1'>
                    {program.program}
                  </span>
                  <span className='text-warning-500 font-medium'>
                    {program.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )} */}

      {/* Financial Summary */}
      {/* {hasFinancialSummary && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <TrendingUp className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-semibold text-white'>
              Financial Summary
            </h2>
          </div>
          <div className='space-y-2'>
            {statement.previous_statement_dues !== null &&
              statement.previous_statement_dues !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Previous Statement Dues
                  </span>
                  <span className='text-sm font-medium text-white'>
                    {formatCurrency(statement.previous_statement_dues)}
                  </span>
                </div>
              )}
            {statement.payments_credits_received !== null &&
              statement.payments_credits_received !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>
                    Payments/Credits Received
                  </span>
                  <span className='text-sm font-medium text-success-500'>
                    {formatCurrency(statement.payments_credits_received)}
                  </span>
                </div>
              )}
            {statement.purchases_debit !== null &&
              statement.purchases_debit !== undefined && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Purchases/Debit</span>
                  <span className='text-sm font-medium text-error-500'>
                    {formatCurrency(statement.purchases_debit)}
                  </span>
                </div>
              )}
            {statement.finance_charges !== null &&
              statement.finance_charges !== undefined &&
              statement.finance_charges > 0 && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Finance Charges</span>
                  <span className='text-sm font-medium text-error-500'>
                    {formatCurrency(statement.finance_charges)}
                  </span>
                </div>
              )}
          </div>
        </div>
      )} */}

      {/* EMI Loans */}
      {statement.emi_loans && statement.emi_loans.length > 0 && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <Building2 className='w-5 h-5 text-warning-500' />
            <h2 className='text-lg font-semibold text-white'>EMI Loans</h2>
          </div>
          <div className='space-y-3'>
            {statement.emi_loans.map((loan, idx) => (
              <div
                key={idx}
                className='p-3 bg-gray-900 rounded-lg border border-gray-700'
              >
                <div className='flex justify-between items-start mb-2'>
                  <div>
                    <div className='text-sm font-medium text-white'>
                      Loan #{loan.loanNumber}
                    </div>
                    <div className='text-xs text-gray-400 mt-1'>
                      Booked:{' '}
                      {format(new Date(loan.bookedDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-bold text-white'>
                      {formatCurrency(loan.amount)}
                    </div>
                    <div className='text-xs text-gray-400'>{loan.tenure}</div>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-700'>
                  <div>
                    <span className='text-gray-400'>Outstanding:</span>
                    <span className='text-white ml-1'>
                      {formatCurrency(loan.outstandingBalance)}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Interest:</span>
                    <span className='text-white ml-1'>
                      {formatCurrency(loan.interestPayable)}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Rate:</span>
                    <span className='text-white ml-1'>
                      {loan.rateOfInterest}%
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Balance Tenure:</span>
                    <span className='text-white ml-1'>
                      {loan.balanceTenure}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GST Summary */}
      {/* {statement.gst_summary && statement.gst_summary.total > 0 && (
        <div className='bg-gray-800 rounded-xl p-3 border border-gray-700'>
          <div className='flex items-center gap-2 mb-3'>
            <Receipt className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-semibold text-white'>GST Summary</h2>
          </div>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            {statement.gst_summary.igst > 0 && (
              <div className='flex justify-between'>
                <span className='text-gray-400'>IGST</span>
                <span className='text-white'>
                  {formatCurrency(statement.gst_summary.igst)}
                </span>
              </div>
            )}
            {statement.gst_summary.cgst > 0 && (
              <div className='flex justify-between'>
                <span className='text-gray-400'>CGST</span>
                <span className='text-white'>
                  {formatCurrency(statement.gst_summary.cgst)}
                </span>
              </div>
            )}
            {statement.gst_summary.sgst > 0 && (
              <div className='flex justify-between'>
                <span className='text-gray-400'>SGST</span>
                <span className='text-white'>
                  {formatCurrency(statement.gst_summary.sgst)}
                </span>
              </div>
            )}
            {statement.gst_summary.reversal > 0 && (
              <div className='flex justify-between'>
                <span className='text-gray-400'>Reversal</span>
                <span className='text-white'>
                  {formatCurrency(statement.gst_summary.reversal)}
                </span>
              </div>
            )}
            <div className='flex justify-between col-span-2 pt-2 border-t border-gray-700 font-semibold'>
              <span className='text-white'>Total GST</span>
              <span className='text-primary'>
                {formatCurrency(statement.gst_summary.total)}
              </span>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
