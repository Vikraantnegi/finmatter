'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Edit2, ExternalLink, Eye, Trash2, UploadCloud } from 'lucide-react';
import { CardPreview } from './CardPreview';
import { cn, formatCurrency } from '@/lib/utils';
import type { Card } from '@finmatter/types';

interface CardDetailsViewProps {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

export const CardDetailsView = ({
  card,
  onEdit,
  onDelete,
}: CardDetailsViewProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this card? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  // Format dates
  const formattedExpiry =
    card.expiryMonth && card.expiryYear
      ? `${String(card.expiryMonth).padStart(2, '0')}/${String(
          card.expiryYear,
        ).slice(-2)}`
      : 'N/A';

  const formattedIssueDate = card.issueDate
    ? new Date(card.issueDate).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const formattedBillingDay = card.billingDay
    ? `${card.billingDay}${getOrdinalSuffix(card.billingDay)} of month`
    : 'N/A';

  function getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  // Status badge color
  const statusColors = {
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    blocked: 'bg-red-500/20 text-red-400',
    expired: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className='space-y-7 pb-10'>
      {/* Card Visual */}
      <div className='px-6 pt-4'>
        <div className='h-60'>
          <CardPreview card={card} className='h-60 w-full' />
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className='px-6 mt-2'>
        <div className='grid grid-cols-4 gap-4'>
          <QuickAction
            icon={Edit2}
            label='Edit'
            onClick={onEdit}
            intent='primary'
          />
          <QuickAction icon={Eye} label='Transactions' disabled />
          <QuickAction icon={UploadCloud} label='Upload' disabled />
          <QuickAction
            icon={Trash2}
            label={isDeleting ? 'Deleting…' : 'Delete'}
            onClick={handleDelete}
            intent='danger'
            disabled={isDeleting}
          />
        </div>
      </div>

      {/* Card Info Section */}
      <div className='px-6 space-y-6'>
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80 space-y-3'>
          <h3 className='text-lg font-semibold text-white mb-4'>Card Info</h3>

          {/* Bank */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Bank</span>
            <div className='flex items-center gap-2'>
              {card.bank?.logoUrl && (
                <div className='relative w-6 h-6'>
                  <Image
                    src={card.bank.logoUrl}
                    alt={card.bank.displayName || card.bank.name}
                    fill
                    className='object-contain'
                  />
                </div>
              )}
              <span className='text-sm font-medium text-white'>
                {card.bank?.displayName || card.bank?.name || 'Unknown Bank'}
              </span>
            </div>
          </div>

          {/* Card Name */}
          {card.cardMetadata?.displayName && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Card Name</span>
              <span className='text-sm font-medium text-white'>
                {card.cardMetadata.displayName}
              </span>
            </div>
          )}

          {/* Network */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Network</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white uppercase'>
                {card.cardMetadata?.network || card.network || 'N/A'}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Status</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[card.status] || statusColors.inactive
              }`}
            >
              {card.status}
            </span>
          </div>

          {/* Last 4 Digits */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Last 4 Digits</span>
            <span className='text-sm font-mono text-white'>
              {card.lastFourDigits}
            </span>
          </div>

          {/* Card Holder Name (Editable) */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Card Holder Name</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white'>
                {card.cardHolderName || 'N/A'}
              </span>
              <button
                onClick={onEdit}
                className='p-1 text-gray-400 hover:text-primary transition-colors'
              >
                <Edit2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Card Details Section */}
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80 space-y-3'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Card Details
          </h3>

          {/* Expiry Date */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Expiry Date</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white'>
                {formattedExpiry}
              </span>
              <button
                onClick={onEdit}
                className='p-1 text-gray-400 hover:text-primary transition-colors'
              >
                <Edit2 className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Billing Day */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Billing Day</span>
            <span className='text-sm font-medium text-white'>
              {formattedBillingDay}
            </span>
          </div>

          {/* Issue Date */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-400'>Issue Date</span>
            <span className='text-sm font-medium text-white'>
              {formattedIssueDate}
            </span>
          </div>

          {/* Credit Limit */}
          {card.creditLimit !== undefined && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Credit Limit</span>
              <span className='text-sm font-medium text-white'>
                {formatCurrency(card.creditLimit)}
              </span>
            </div>
          )}

          {/* Available Credit */}
          {card.availableCredit !== undefined && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Available Credit</span>
              <span className='text-sm font-medium text-white'>
                {formatCurrency(card.availableCredit)}
              </span>
            </div>
          )}
        </div>

        {/* Card Metadata Section */}
        {card.cardMetadata && (
          <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80 space-y-3'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Card Metadata
            </h3>

            {/* Benefits */}
            {card.cardMetadata.benefits &&
              Array.isArray(card.cardMetadata.benefits) &&
              card.cardMetadata.benefits.length > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-400'>Benefits</span>
                  <button className='flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium'>
                    View List
                    <ExternalLink className='w-3 h-3' />
                  </button>
                </div>
              )}

            {/* Active Offers */}
            {card.cardMetadata.offers &&
              Array.isArray(card.cardMetadata.offers) &&
              card.cardMetadata.offers.length > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-400'>Active Offers</span>
                  <button className='flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium'>
                    View {card.cardMetadata.offers.length} Offers
                    <ExternalLink className='w-3 h-3' />
                  </button>
                </div>
              )}

            {/* Rewards Structure */}
            {card.cardMetadata.rewards && (
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-400'>Rewards Structure</span>
                <button className='flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium'>
                  View Details
                  <ExternalLink className='w-3 h-3' />
                </button>
              </div>
            )}

            {/* Annual Fee */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Annual Fee</span>
              <span className='text-sm font-medium text-white'>
                {formatCurrency(card.cardMetadata.annualFee || 0)}
              </span>
            </div>

            {/* Joining Fee */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Joining Fee</span>
              <span className='text-sm font-medium text-white'>
                {formatCurrency(card.cardMetadata.joiningFee || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  intent?: 'primary' | 'danger' | 'neutral';
}

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  intent = 'neutral',
}: QuickActionProps) => {
  const circleClasses =
    intent === 'primary'
      ? 'bg-primary text-white'
      : intent === 'danger'
        ? 'bg-red-600 text-white'
        : 'bg-slate-800 text-slate-100';

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 text-sm font-medium',
        disabled ? 'opacity-35 cursor-not-allowed' : 'hover:opacity-90',
      )}
    >
      <span
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center shadow-[0_18px_32px_-18px_rgba(15,23,42,0.65)] transition-all',
          circleClasses,
        )}
      >
        <Icon className='w-5 h-5' />
      </span>
      <span className='text-xs text-gray-200 text-center leading-tight'>
        {label}
      </span>
    </button>
  );
};
