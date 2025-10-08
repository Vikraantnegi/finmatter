'use client';

import { Card } from '@finmatter/types';
import { CreditCard, Eye } from 'lucide-react';

interface CardVisualProps {
  card: Card;
  showDetails?: boolean;
  className?: string;
}

export function CardVisual({
  card,
  showDetails = true,
  className = '',
}: CardVisualProps) {
  // Calculate utilization percentage
  const utilization =
    card.creditLimit && card.availableCredit
      ? ((card.creditLimit - card.availableCredit) / card.creditLimit) * 100
      : 0;

  // Get card colors from metadata or use defaults
  const primaryColor = card.primaryColor || '#3b82f6';
  const secondaryColor = card.secondaryColor || '#1d4ed8';

  // Generate gradient style
  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Card Visual */}
      <div className='relative h-48 p-6 text-white' style={gradientStyle}>
        {/* Card Network Logo */}
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center space-x-2'>
            <CreditCard className='w-6 h-6' />
            <span className='font-medium text-sm opacity-90'>
              {card.network?.toUpperCase() || 'VISA'}
            </span>
          </div>
          <div className='text-right'>
            <div className='text-xs opacity-75'>BALANCE</div>
            <div className='font-bold text-lg'>
              ₹{card.availableCredit?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className='mt-auto'>
          <div className='text-sm opacity-75 mb-1'>CARD HOLDER</div>
          <div className='font-medium text-lg mb-4'>{card.cardName}</div>
          <div className='flex justify-between items-end'>
            <div>
              <div className='text-xs opacity-75'>CARD NUMBER</div>
              <div className='font-mono text-lg'>
                •••• •••• •••• {card.lastFourDigits || '••••'}
              </div>
            </div>
            {card.expiryDate && (
              <div className='text-right'>
                <div className='text-xs opacity-75'>EXPIRES</div>
                <div className='font-medium'>
                  {new Date(card.expiryDate).toLocaleDateString('en-GB', {
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className='absolute top-4 right-4 opacity-20'>
          <div className='w-12 h-12 rounded-full bg-white'></div>
        </div>
        <div className='absolute bottom-4 right-8 opacity-10'>
          <div className='w-8 h-8 rounded-full bg-white'></div>
        </div>
      </div>

      {/* Card Info */}
      {showDetails && (
        <div className='p-4 space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-600'>Credit Limit</span>
            <span className='font-medium'>
              ₹{card.creditLimit?.toLocaleString() || '0'}
            </span>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-600'>Used</span>
            <span className='font-medium text-red-600'>
              ₹
              {card.creditLimit && card.availableCredit
                ? (card.creditLimit - card.availableCredit).toLocaleString()
                : '0'}
            </span>
          </div>

          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Utilization</span>
              <span
                className={`font-medium ${utilization > 80 ? 'text-red-600' : utilization > 50 ? 'text-yellow-600' : 'text-green-600'}`}
              >
                {utilization.toFixed(1)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  utilization > 80
                    ? 'bg-red-500'
                    : utilization > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>

          {card.bankName && (
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Bank</span>
              <span className='font-medium'>{card.bankName}</span>
            </div>
          )}

          {card.rewardType && (
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Rewards</span>
              <span className='font-medium capitalize'>{card.rewardType}</span>
            </div>
          )}

          {/* Action Button */}
          <div className='pt-2'>
            <button className='w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors'>
              <Eye className='w-4 h-4 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                View Details
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
