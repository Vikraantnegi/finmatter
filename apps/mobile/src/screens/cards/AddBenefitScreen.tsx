/**
 * Add Benefit Screen
 * Form for adding new benefits to a credit card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';

// Types
import { Card } from '@finmatter/types';

// Services
import { cardService } from '../../services/cardService';

// Utils
import { haptics } from '../../utils/haptics';

interface AddBenefitScreenProps {
  navigation: any;
  route: {
    params: {
      cardId: string;
      card?: Card;
    };
  };
}

const AddBenefitScreen: React.FC<AddBenefitScreenProps> = ({
  navigation,
  route,
}) => {
  const { cardId, card } = route.params;

  const [formData, setFormData] = useState({
    category: '',
    rewardRate: '',
    rewardCap: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Common spending categories
  const categories = [
    'Dining',
    'Shopping',
    'Fuel',
    'Travel',
    'Groceries',
    'Entertainment',
    'Bills',
    'Healthcare',
    'Education',
    'Utilities',
    'Transport',
    'Other',
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.rewardRate.trim()) {
      newErrors.rewardRate = 'Reward rate is required';
    } else if (
      isNaN(Number(formData.rewardRate)) ||
      Number(formData.rewardRate) <= 0
    ) {
      newErrors.rewardRate = 'Reward rate must be a positive number';
    } else if (Number(formData.rewardRate) > 100) {
      newErrors.rewardRate = 'Reward rate cannot exceed 100%';
    }

    if (
      formData.rewardCap &&
      (isNaN(Number(formData.rewardCap)) || Number(formData.rewardCap) <= 0)
    ) {
      newErrors.rewardCap = 'Reward cap must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      haptics.error();
      return;
    }

    try {
      setLoading(true);
      haptics.success();

      const benefitData = {
        category: formData.category,
        rewardRate: Number(formData.rewardRate),
        rewardCap: formData.rewardCap ? Number(formData.rewardCap) : undefined,
        isActive: formData.isActive,
      };

      const response = await cardService.addCardBenefit(cardId, benefitData);

      if (response.success) {
        Alert.alert('Success', 'Benefit added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          response.error?.message || 'Failed to add benefit',
        );
      }
    } catch (error) {
      console.error('Add benefit error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-4 py-4 border-b border-border'>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className='p-2'
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color='#374151' />
        </TouchableOpacity>
        <Text className='text-xl font-bold text-text'>Add Benefit</Text>
        <View className='w-8' />
      </View>

      <ScrollView
        className='flex-1 px-4 py-6'
        showsVerticalScrollIndicator={false}
      >
        {/* Card Info */}
        {card && (
          <View className='mb-6'>
            <Text className='text-text-secondary text-sm mb-2'>
              Adding benefit to:
            </Text>
            <Text className='text-text font-semibold text-lg'>
              {card.cardName}
            </Text>
            <Text className='text-text-secondary'>{card.bankName}</Text>
          </View>
        )}

        {/* Category Selection */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Category</Text>
          <View className='flex-row flex-wrap'>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                onPress={() => updateFormData('category', category)}
                className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                  formData.category === category ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <Text
                  className={`font-medium ${
                    formData.category === category ? 'text-white' : 'text-text'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text className='text-red-500 text-sm mt-1'>{errors.category}</Text>
          )}
        </View>

        {/* Reward Rate */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Reward Rate (%)</Text>
          <TextInput
            value={formData.rewardRate}
            onChangeText={value => updateFormData('rewardRate', value)}
            placeholder='5.0'
            placeholderTextColor='#9CA3AF'
            className='bg-secondary px-4 py-3 rounded-lg text-text text-base'
            keyboardType='numeric'
          />
          {errors.rewardRate && (
            <Text className='text-red-500 text-sm mt-1'>
              {errors.rewardRate}
            </Text>
          )}
        </View>

        {/* Reward Cap */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Reward Cap (₹)</Text>
          <Text className='text-text-secondary text-sm mb-2'>
            Maximum reward amount per period (optional)
          </Text>
          <TextInput
            value={formData.rewardCap}
            onChangeText={value => updateFormData('rewardCap', value)}
            placeholder='500'
            placeholderTextColor='#9CA3AF'
            className='bg-secondary px-4 py-3 rounded-lg text-text text-base'
            keyboardType='numeric'
          />
          {errors.rewardCap && (
            <Text className='text-red-500 text-sm mt-1'>
              {errors.rewardCap}
            </Text>
          )}
        </View>

        {/* Active Toggle */}
        <View className='mb-8'>
          <TouchableOpacity
            onPress={() => updateFormData('isActive', !formData.isActive)}
            className='flex-row items-center justify-between py-3'
          >
            <Text className='text-text font-semibold'>Active</Text>
            <View
              className={`w-12 h-6 rounded-full ${
                formData.isActive ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                  formData.isActive ? 'ml-6' : 'ml-0.5'
                }`}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className='px-4 py-6 border-t border-border'>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-lg flex-row items-center justify-center ${
            loading ? 'bg-gray-400' : 'bg-primary'
          }`}
        >
          {loading ? (
            <ActivityIndicator size='small' color='white' />
          ) : (
            <>
              <Check size={20} color='white' />
              <Text className='text-white font-semibold text-lg ml-2'>
                Add Benefit
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddBenefitScreen;
