/**
 * Benefit Item Component
 * Displays individual card benefit with edit/delete actions
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit, Trash2, TrendingUp } from 'lucide-react-native';
import { CardBenefit } from '@finmatter/types';

interface BenefitItemProps {
  benefit: CardBenefit;
  onEdit?: () => void;
  onDelete?: () => void;
}

const BenefitItem: React.FC<BenefitItemProps> = ({
  benefit,
  onEdit,
  onDelete,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dining':
        return '🍽️';
      case 'shopping':
        return '🛍️';
      case 'fuel':
        return '⛽';
      case 'travel':
        return '✈️';
      case 'groceries':
        return '🛒';
      case 'entertainment':
        return '🎬';
      case 'bills':
        return '📱';
      case 'healthcare':
        return '🏥';
      case 'education':
        return '📚';
      case 'utilities':
        return '⚡';
      default:
        return '💳';
    }
  };

  const formatRewardRate = (rate: number) => {
    return `${rate}%`;
  };

  const formatRewardCap = (cap?: number) => {
    if (!cap) return '';
    return `(Max ₹${cap.toLocaleString('en-IN')})`;
  };

  return (
    <View className='bg-secondary rounded-lg p-4 border border-border'>
      <View className='flex-row items-start justify-between'>
        {/* Benefit Info */}
        <View className='flex-1'>
          <View className='flex-row items-center mb-2'>
            <Text className='text-2xl mr-2'>
              {getCategoryIcon(benefit.category)}
            </Text>
            <Text className='text-lg font-semibold text-text capitalize'>
              {benefit.category}
            </Text>
          </View>

          <View className='flex-row items-center mb-1'>
            <TrendingUp size={16} color='#10B981' />
            <Text className='text-green-600 font-bold text-lg ml-1'>
              {formatRewardRate(benefit.rewardRate)}
            </Text>
            <Text className='text-text-secondary ml-2'>
              {formatRewardCap(benefit.rewardCap)}
            </Text>
          </View>

          {benefit.conditions && Object.keys(benefit.conditions).length > 0 && (
            <Text className='text-text-secondary text-sm'>
              Conditions: {JSON.stringify(benefit.conditions)}
            </Text>
          )}

          <View className='flex-row items-center mt-2'>
            <View
              className={`px-2 py-1 rounded-full ${
                benefit.isActive ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  benefit.isActive ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {benefit.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className='flex-row space-x-2 ml-4'>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              className='p-2 bg-primary/10 rounded-lg'
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Edit size={16} color='#3B82F6' />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              className='p-2 bg-red-100 rounded-lg'
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color='#EF4444' />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default BenefitItem;
