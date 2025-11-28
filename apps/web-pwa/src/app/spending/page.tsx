'use client';

import React from 'react';
import {
  PieChart,
  TrendingUp,
  Calendar,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export default function SpendingPage() {
  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-6 border-b border-gray-800'>
        <h1 className='text-2xl font-bold text-white'>Spending Insights</h1>
        <p className='text-sm text-gray-400 mt-1'>
          Global spending analytics and insights
        </p>
      </div>

      {/* Coming Soon Content */}
      <div className='flex-1 flex items-center justify-center px-6'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center'>
              <PieChart className='w-12 h-12 text-primary' />
            </div>
          </div>

          <div className='space-y-2'>
            <h2 className='text-2xl font-bold text-white'>Coming Soon</h2>
            <p className='text-gray-400'>
              We&apos;re building comprehensive spending insights to help you
              understand your spending patterns across all cards.
            </p>
          </div>

          {/* Features Preview */}
          <div className='mt-8 space-y-4'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              What to Expect
            </h3>

            <div className='space-y-3'>
              <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0'>
                    <BarChart3 className='w-5 h-5 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-base font-semibold text-white mb-1'>
                      Spending Analytics
                    </h4>
                    <p className='text-sm text-gray-400'>
                      View spending trends, monthly comparisons, and category
                      breakdowns across all your cards.
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0'>
                    <TrendingUp className='w-5 h-5 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-base font-semibold text-white mb-1'>
                      Spending Trends
                    </h4>
                    <p className='text-sm text-gray-400'>
                      Track your spending over time with interactive charts and
                      identify patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0'>
                    <Calendar className='w-5 h-5 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-base font-semibold text-white mb-1'>
                      Category Insights
                    </h4>
                    <p className='text-sm text-gray-400'>
                      Understand where your money goes with detailed category
                      analysis and spending distribution.
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0'>
                    <Sparkles className='w-5 h-5 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-base font-semibold text-white mb-1'>
                      Smart Insights
                    </h4>
                    <p className='text-sm text-gray-400'>
                      Get personalized insights and recommendations based on
                      your spending behavior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className='mt-8 pt-6 border-t border-gray-800'>
            <p className='text-sm text-gray-400'>
              For now, you can view transactions for individual cards from the{' '}
              <span className='text-primary font-medium'>Cards</span> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
