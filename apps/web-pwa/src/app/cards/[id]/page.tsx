'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  TrendingUp,
  Award,
  Gift,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

// This will be replaced with actual data from API
const MOCK_CARD = {
  id: '1',
  cardName: 'HDFC Regalia',
  bankName: 'HDFC Bank',
  network: 'Visa' as const,
  lastFourDigits: '8049',
  creditLimit: 500000,
  availableCredit: 485000,
  currentBalance: 15000,
  statementDate: '2024-11-25',
  dueDate: '2024-12-05',
  rewardsBalance: 12500,
  rewardsValue: 125.0,
  cardNumber: '4234567890128049',
  cardholderName: 'Vikrant Negi',
  expiryDate: '12/28',

  // Comprehensive metadata
  metadata: {
    annualFee: 2500,
    joiningFee: 2500,
    annualFeeWaiver: 'Spend ₹3L in a year',
    welcomeBonus: '10,000 bonus points on first transaction',
    loungeAccess: 'Domestic: 6 free, International: 3 free per year',
    features: [
      'Complimentary airport lounge access',
      '4 reward points per ₹150 spent',
      'Fuel surcharge waiver',
      'Zero lost card liability',
    ],
    rewards: {
      base: '2.67%',
      categories: [
        { name: 'Travel', rate: '4%', icon: '✈️' },
        { name: 'Dining', rate: '3.3%', icon: '🍽️' },
        { name: 'Shopping', rate: '2.67%', icon: '🛍️' },
        { name: 'Others', rate: '2.67%', icon: '💳' },
      ],
    },
  },

  // Recent offers
  offers: [
    {
      id: '1',
      title: '10% back at Starbucks',
      description: 'Valid till Nov 30',
      icon: '☕',
      status: 'active' as const,
      expiryDate: '2024-11-30',
    },
    {
      id: '2',
      title: '5x Points on United',
      description: 'Book flights by Dec 15',
      icon: '✈️',
      status: 'activated' as const,
      expiryDate: '2024-12-15',
    },
  ],

  // Recent transactions
  recentTransactions: [
    {
      id: '1',
      merchant: 'Apple Store',
      category: 'Shopping',
      amount: -99900,
      date: '2024-10-15',
      icon: '🛍️',
    },
    {
      id: '2',
      merchant: 'The Daily Grind',
      category: 'Dining',
      amount: -575,
      date: '2024-10-14',
      icon: '🍽️',
    },
    {
      id: '3',
      merchant: 'City Transit',
      category: 'Transport',
      amount: -275,
      date: '2024-10-14',
      icon: '🚌',
    },
  ],

  // Spending by category (for chart)
  spending: [
    { category: 'Dining', amount: 4500, percentage: 30 },
    { category: 'Shopping', amount: 5500, percentage: 37 },
    { category: 'Travel', amount: 3000, percentage: 20 },
    { category: 'Entertainment', amount: 2000, percentage: 13 },
  ],
};

export default function CardDetailsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'offers' | 'benefits' | 'analytics'
  >('offers');

  const card = MOCK_CARD; // Replace with actual data from API

  const utilization =
    ((card.creditLimit - card.availableCredit) / card.creditLimit) * 100;

  return (
    <div className='min-h-screen bg-background-dark pb-20'>
      {/* Header */}
      <div className='sticky top-0 z-20 bg-background-dark/95 backdrop-blur-sm border-b border-gray-800'>
        <div className='flex items-center justify-between px-4 py-4'>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 hover:bg-gray-800 transition-colors'
          >
            <ArrowLeft className='w-5 h-5 text-white' />
          </motion.button>

          <h1 className='text-lg font-semibold text-white'>{card.cardName}</h1>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/cards/${card.id}/edit`)}
            className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 hover:bg-gray-800 transition-colors'
          >
            <Settings className='w-5 h-5 text-white' />
          </motion.button>
        </div>
      </div>

      <div className='px-6 py-6 space-y-6'>
        {/* Card Visual */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex justify-center'
        >
          <div className='w-80'>
            <Avatar
              name={card.cardName}
              avatar={undefined}
              size='2xl'
              className='mx-auto mb-4'
            />
            <h2 className='text-xl font-bold text-white text-center'>
              {card.cardName}
            </h2>
            <p className='text-sm text-gray-400 text-center'>
              Credit Limit: ₹{(card.creditLimit / 100000).toFixed(1)}L
            </p>
          </div>
        </motion.div>

        {/* Balance Cards */}
        <div className='grid grid-cols-2 gap-4'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className='p-4 bg-gray-800/30 rounded-xl border border-gray-800'
          >
            <p className='text-xs text-gray-400 mb-1'>Current Balance</p>
            <p className='text-2xl font-bold text-white'>
              ₹{(card.currentBalance / 100).toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className='p-4 bg-gray-800/30 rounded-xl border border-gray-800'
          >
            <p className='text-xs text-gray-400 mb-1'>Available Credit</p>
            <p className='text-2xl font-bold text-white'>
              ₹{(card.availableCredit / 100).toFixed(2)}
            </p>
          </motion.div>
        </div>

        {/* Utilization Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='p-4 bg-gray-800/30 rounded-xl border border-gray-800'
        >
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm text-gray-400'>Credit Utilization</span>
            <span className='text-sm font-semibold text-white'>
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className='h-2 bg-gray-700 rounded-full overflow-hidden'>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${utilization}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${
                utilization < 30
                  ? 'bg-green-500'
                  : utilization < 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <div className='flex gap-2 p-1 bg-gray-800/30 rounded-xl'>
          {[
            { key: 'offers', label: 'Offers', icon: Gift },
            { key: 'benefits', label: 'Benefits', icon: Award },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className='w-4 h-4' />
              <span className='text-sm font-medium'>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'offers' && (
          <motion.div
            key='offers'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-4'
          >
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-white'>
                Current Offers
              </h3>
              <span className='text-sm text-primary'>
                {card.offers.length} active
              </span>
            </div>

            {card.offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='flex items-center gap-4 p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl border border-gray-800 transition-colors group cursor-pointer'
              >
                <div className='w-12 h-12 flex items-center justify-center bg-primary/10 rounded-xl text-2xl'>
                  {offer.icon}
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-white'>{offer.title}</p>
                  <p className='text-sm text-gray-400'>{offer.description}</p>
                </div>
                {offer.status === 'activated' ? (
                  <div className='w-8 h-8 flex items-center justify-center bg-green-500/20 rounded-full'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' />
                  </div>
                ) : (
                  <button className='px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors'>
                    Activate
                  </button>
                )}
              </motion.div>
            ))}

            {/* Rewards Progress */}
            <div className='mt-6 p-6 bg-gradient-to-br from-primary/10 to-purple-900/10 rounded-2xl border border-primary/30'>
              <div className='flex items-center justify-between mb-4'>
                <h4 className='text-lg font-semibold text-white'>
                  Rewards Progress
                </h4>
                <span className='text-2xl font-bold text-primary'>
                  {card.rewardsBalance.toLocaleString()} pts
                </span>
              </div>
              <div className='h-2 bg-gray-800 rounded-full overflow-hidden mb-2'>
                <div className='h-full w-3/4 bg-gradient-to-r from-primary to-blue-400' />
              </div>
              <p className='text-sm text-gray-400'>
                Equivalent to ₹{card.rewardsValue.toFixed(2)}
              </p>
              <button className='mt-4 w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors'>
                Redeem
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'benefits' && (
          <motion.div
            key='benefits'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-4'
          >
            <h3 className='text-lg font-semibold text-white'>Card Benefits</h3>

            {/* Key Features */}
            <div className='grid gap-3'>
              {card.metadata.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='flex items-start gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-800'
                >
                  <div className='w-8 h-8 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded-lg'>
                    <Sparkles className='w-4 h-4 text-primary' />
                  </div>
                  <p className='text-sm text-gray-300'>{feature}</p>
                </motion.div>
              ))}
            </div>

            {/* Rewards by Category */}
            <div className='mt-6'>
              <h4 className='text-base font-semibold text-white mb-3'>
                Reward Categories
              </h4>
              <div className='space-y-3'>
                {card.metadata.rewards.categories.map((cat, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-800'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-2xl'>{cat.icon}</span>
                      <span className='text-white font-medium'>{cat.name}</span>
                    </div>
                    <span className='text-primary font-semibold'>
                      {cat.rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fees */}
            <div className='mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-800'>
              <h4 className='text-base font-semibold text-white mb-3'>
                Fees & Charges
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Annual Fee</span>
                  <span className='text-white font-medium'>
                    ₹{card.metadata.annualFee}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Fee Waiver</span>
                  <span className='text-white text-xs'>
                    {card.metadata.annualFeeWaiver}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key='analytics'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-4'
          >
            <h3 className='text-lg font-semibold text-white'>
              Spending by Category
            </h3>

            {/* Spending bars */}
            {card.spending.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className='space-y-2'
              >
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>{item.category}</span>
                  <span className='text-white font-medium'>₹{item.amount}</span>
                </div>
                <div className='h-3 bg-gray-800 rounded-full overflow-hidden'>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className='h-full bg-primary'
                  />
                </div>
              </motion.div>
            ))}

            {/* Recent Transactions */}
            <div className='mt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h4 className='text-base font-semibold text-white'>
                  Recent Activity
                </h4>
                <button className='text-sm text-primary'>View All</button>
              </div>

              <div className='space-y-3'>
                {card.recentTransactions.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl'
                  >
                    <div className='w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg text-xl'>
                      {txn.icon}
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-white'>
                        {txn.merchant}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {txn.category} • {txn.date}
                      </p>
                    </div>
                    <span className='text-base font-semibold text-white'>
                      ₹{Math.abs(txn.amount / 100).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Actions */}
        <div className='grid grid-cols-2 gap-4 pt-4'>
          <button className='px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors'>
            Make Payment
          </button>
          <button className='px-6 py-3 bg-gray-800/50 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors'>
            View Statement
          </button>
        </div>
      </div>
    </div>
  );
}
