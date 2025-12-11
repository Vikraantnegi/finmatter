'use client';

import React from 'react';
import { Award, Coffee, Plane, ShoppingCart, Check } from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';
import type { Card, CardOffer, CardRewardsProgress } from '@finmatter/types';

interface RewardsAndOffersProps {
  card: Card;
  rewardPoints?: number | null;
}

export function RewardsAndOffers({
  card,
  rewardPoints = null,
}: RewardsAndOffersProps) {
  // Get offers from card metadata
  const offers: CardOffer[] = (card.cardMetadata?.offers as CardOffer[]) || [];

  // Get rewards progress configuration from card metadata
  const rewardsProgress: CardRewardsProgress | null =
    (card.cardMetadata?.rewardsProgress as CardRewardsProgress) || null;

  // Use rewards progress config if available, otherwise use defaults
  const unit = rewardsProgress?.unit || 'pts';
  const displayName = rewardsProgress?.displayName || 'Reward Points';
  const redemptionRate = rewardsProgress?.redemptionRate || 0.084; // Default: 1 point = ₹0.084

  // Calculate equivalent value using redemption rate from metadata
  const equivalentValue = rewardPoints ? rewardPoints * redemptionRate : 0;

  // Calculate progress to next milestone
  // Use first milestone from metadata if available, otherwise use default
  const milestones = rewardsProgress?.milestones || [];
  const nextMilestone =
    milestones.length > 0
      ? milestones[0].threshold
      : rewardPoints
        ? rewardPoints * 1.1
        : 13000; // Default: 10% more than current
  const pointsToNextMilestone = rewardPoints
    ? Math.max(0, nextMilestone - rewardPoints)
    : 0;
  const progressPercentage =
    rewardPoints && nextMilestone > 0
      ? Math.min(100, (rewardPoints / nextMilestone) * 100)
      : 0;

  // Get offer icon
  const getOfferIcon = (offer: CardOffer) => {
    const title = offer.title?.toLowerCase() || '';
    if (title.includes('starbucks') || title.includes('coffee')) {
      return <Coffee className='w-5 h-5' />;
    }
    if (title.includes('travel') || title.includes('flight')) {
      return <Plane className='w-5 h-5' />;
    }
    if (title.includes('amazon') || title.includes('shopping')) {
      return <ShoppingCart className='w-5 h-5' />;
    }
    return <Award className='w-5 h-5' />;
  };

  // Format expiry date
  const formatExpiry = (validity?: string | null): string => {
    if (!validity) return '';
    try {
      const date = new Date(validity);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Expired';
      if (diffDays === 0) return 'Expires today';
      if (diffDays === 1) return 'Expires tomorrow';
      if (diffDays < 7) return `Expires in ${diffDays} days`;
      if (diffDays < 14) return `Expires in ${Math.ceil(diffDays / 7)} week`;
      return `Expires in ${Math.ceil(diffDays / 7)} weeks`;
    } catch {
      return '';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Rewards Progress */}
      {rewardPoints !== null && (
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            {displayName} Progress
          </h3>
          <div className='space-y-4'>
            <div className='flex items-end justify-between'>
              <div>
                <p className='text-3xl font-bold text-white mb-1'>
                  {rewardPoints.toLocaleString()} {unit}
                </p>
                {redemptionRate > 0 && (
                  <p className='text-sm text-gray-400'>
                    Equivalent to {formatCurrency(equivalentValue)}
                  </p>
                )}
              </div>
              <button className='px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors'>
                Redeem
              </button>
            </div>

            {/* Progress Bar */}
            <div className='space-y-2'>
              <div className='w-full h-3 bg-gray-700 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-primary rounded-full transition-all'
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {pointsToNextMilestone > 0 && (
                <p className='text-xs text-gray-400'>
                  You are {pointsToNextMilestone.toLocaleString()} {unit} away
                  from
                  {milestones.length > 0 && milestones[0].reward
                    ? ` ${milestones[0].reward}`
                    : ' the next reward'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Offers */}
      {offers.length > 0 && (
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Current Offers
          </h3>
          <div className='space-y-3'>
            {offers.map((offer, index) => {
              const isActivated = offer.isActive;
              const expiryText = formatExpiry(offer.validity);

              return (
                <div
                  key={index}
                  className='flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-700'
                >
                  <div className='w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0'>
                    {getOfferIcon(offer)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-white mb-1'>
                      {offer.title}
                    </p>
                    {expiryText && (
                      <p className='text-xs text-gray-400'>{expiryText}</p>
                    )}
                  </div>
                  {isActivated ? (
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <span className='text-xs text-primary font-medium'>
                        Activated
                      </span>
                      <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center'>
                        <Check className='w-4 h-4 text-primary' />
                      </div>
                    </div>
                  ) : (
                    <button className='px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0'>
                      Activate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rewardPoints === null && offers.length === 0 && (
        <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80'>
          <div className='text-center py-8'>
            <Award className='w-12 h-12 text-gray-500 mx-auto mb-3' />
            <p className='text-sm text-gray-400'>
              No rewards or offers available for this card
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
