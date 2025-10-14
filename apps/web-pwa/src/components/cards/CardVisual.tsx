'use client';

import { Card } from '@/types/card';
import { Eye } from 'lucide-react';
import { getNetworkLogo } from '@/components/icons/CardNetworks';
import { getCardColors, getCardStatusInfo } from '@/lib/cardColors';

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

  // Get card colors (use custom, bank-specific, or generate)
  const colors = getCardColors(
    card.bankName,
    card.primaryColor,
    card.secondaryColor,
  );

  // Generate gradient style
  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
  };

  // Get network logo component
  const NetworkLogo = getNetworkLogo(card.network);

  // Get status badge info
  const statusInfo = getCardStatusInfo({
    status: card.status,
    expiryDate: card.expiryDate,
    deletedAt: card.deletedAt,
  });

  // Check if card is inactive/deleted
  const isInactive = card.status === 'inactive' || card.deletedAt;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Card Visual */}
      <div
        className={`relative p-6 text-white transition-all duration-300 hover:shadow-xl ${
          isInactive ? 'opacity-60 grayscale' : ''
        }`}
        style={gradientStyle}
      >
        {/* Status Badge */}
        {statusInfo && statusInfo.show && (
          <div className='absolute top-3 right-3 z-10'>
            <span
              className={`${statusInfo.bgColor} ${statusInfo.color} text-xs px-2 py-1 rounded-full font-semibold shadow-sm`}
            >
              {statusInfo.label}
            </span>
          </div>
        )}

        {/* Bank Name & Network Logo */}
        <div className='flex justify-between items-start mb-6'>
          <div>
            <div className='text-xs opacity-75 mb-2'>{card.bankName}</div>
            <div className='bg-white bg-opacity-95 rounded-md p-1.5 shadow-sm backdrop-blur-sm'>
              <NetworkLogo className='w-14 h-9' />
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className='mt-auto'>
          <div className='font-medium text-lg mb-6'>{card.cardName}</div>
          <div className='flex justify-between items-end'>
            <div>
              <div className='font-mono text-lg tracking-wider'>
                •••• •••• •••• {card.lastFourDigits || '••••'}
              </div>
            </div>
            {card.expiryDate && (
              <div className='text-right'>
                <div className='text-xs opacity-75'>EXPIRES</div>
                <div className='font-medium tracking-wide'>
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

        {/* Inactive Overlay */}
        {isInactive && (
          <div className='absolute inset-0 bg-gray-900 bg-opacity-50 rounded-t-xl flex items-center justify-center'>
            <span className='text-white text-2xl font-bold tracking-wider'>
              {card.deletedAt ? 'DELETED' : 'INACTIVE'}
            </span>
          </div>
        )}
      </div>

      {/* Card Info */}
      {showDetails && (
        <div className='p-4 space-y-3'>
          {/* Only show credit info if statement is uploaded */}
          {card.hasStatement && (
            <>
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
            </>
          )}

          {/* Upload Statement CTA */}
          {!card.hasStatement && (
            <div className='bg-primary-50 rounded-lg p-4 text-center'>
              <p className='text-sm text-primary-700 mb-2'>
                Upload your first statement to see credit limit and utilization
              </p>
              <button className='w-full flex items-center justify-center space-x-2 py-2 px-4 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors'>
                <span className='text-sm font-medium'>Upload Statement</span>
              </button>
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
