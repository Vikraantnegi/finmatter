/**
 * Add Card Screen
 * Form for adding a new credit card to user's portfolio
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
import {
  CreateCardRequest,
  CardType,
  CardNetwork,
  RewardType,
} from '@finmatter/types';

// Services
import { cardService } from '../../services/cardService';

// Utils
import { haptics } from '../../utils/haptics';

interface AddCardScreenProps {
  navigation: any;
  route: any;
}

const AddCardScreen: React.FC<AddCardScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<CreateCardRequest>({
    bankName: '',
    cardName: '',
    lastFourDigits: '',
    cardType: 'credit',
    network: 'visa',
    rewardType: 'cashback',
    annualFee: 0,
    currency: 'INR',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateCardRequest>>({});

  // Bank options
  const bankOptions = [
    'HDFC Bank',
    'ICICI Bank',
    'State Bank of India',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'IndusInd Bank',
    'Yes Bank',
    'Federal Bank',
    'IDBI Bank',
    'Bank of Baroda',
    'Punjab National Bank',
    'Canara Bank',
    'Union Bank of India',
    'Other',
  ];

  // Card type options
  const cardTypeOptions: { value: CardType; label: string }[] = [
    { value: 'credit', label: 'Credit Card' },
    { value: 'debit', label: 'Debit Card' },
    { value: 'prepaid', label: 'Prepaid Card' },
  ];

  // Network options
  const networkOptions: { value: CardNetwork; label: string }[] = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'rupay', label: 'RuPay' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' },
  ];

  // Reward type options
  const rewardTypeOptions: { value: RewardType; label: string }[] = [
    { value: 'cashback', label: 'Cashback' },
    { value: 'points', label: 'Points' },
    { value: 'miles', label: 'Miles' },
    { value: 'none', label: 'No Rewards' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateCardRequest> = {};

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Card name is required';
    }

    if (!formData.lastFourDigits.trim()) {
      newErrors.lastFourDigits = 'Last four digits are required';
    } else if (!/^\d{4}$/.test(formData.lastFourDigits)) {
      newErrors.lastFourDigits = 'Must be exactly 4 digits';
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

      const response = await cardService.createCard(formData);

      if (response.success) {
        Alert.alert('Success', 'Card added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add card');
      }
    } catch (error) {
      console.error('Add card error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateCardRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
        <Text className='text-xl font-bold text-text'>Add Card</Text>
        <View className='w-8' />
      </View>

      <ScrollView
        className='flex-1 px-4 py-6'
        showsVerticalScrollIndicator={false}
      >
        {/* Bank Name */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Bank Name</Text>
          <View className='flex-row flex-wrap'>
            {bankOptions.map(bank => (
              <TouchableOpacity
                key={bank}
                onPress={() => updateFormData('bankName', bank)}
                className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                  formData.bankName === bank ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <Text
                  className={`font-medium ${
                    formData.bankName === bank ? 'text-white' : 'text-text'
                  }`}
                >
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.bankName && (
            <Text className='text-red-500 text-sm mt-1'>{errors.bankName}</Text>
          )}
        </View>

        {/* Card Name */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Card Name</Text>
          <TextInput
            value={formData.cardName}
            onChangeText={value => updateFormData('cardName', value)}
            placeholder='e.g., Millennia Credit Card'
            placeholderTextColor='#9CA3AF'
            className='bg-secondary px-4 py-3 rounded-lg text-text text-base'
            autoCapitalize='words'
          />
          {errors.cardName && (
            <Text className='text-red-500 text-sm mt-1'>{errors.cardName}</Text>
          )}
        </View>

        {/* Last Four Digits */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Last 4 Digits</Text>
          <TextInput
            value={formData.lastFourDigits}
            onChangeText={value =>
              updateFormData(
                'lastFourDigits',
                value.replace(/\D/g, '').slice(0, 4),
              )
            }
            placeholder='1234'
            placeholderTextColor='#9CA3AF'
            className='bg-secondary px-4 py-3 rounded-lg text-text text-base font-mono'
            keyboardType='numeric'
            maxLength={4}
          />
          {errors.lastFourDigits && (
            <Text className='text-red-500 text-sm mt-1'>
              {errors.lastFourDigits}
            </Text>
          )}
        </View>

        {/* Card Type */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Card Type</Text>
          <View className='flex-row flex-wrap'>
            {cardTypeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => updateFormData('cardType', option.value)}
                className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                  formData.cardType === option.value
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}
              >
                <Text
                  className={`font-medium ${
                    formData.cardType === option.value
                      ? 'text-white'
                      : 'text-text'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Network */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Network</Text>
          <View className='flex-row flex-wrap'>
            {networkOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => updateFormData('network', option.value)}
                className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                  formData.network === option.value
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}
              >
                <Text
                  className={`font-medium ${
                    formData.network === option.value
                      ? 'text-white'
                      : 'text-text'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reward Type */}
        <View className='mb-6'>
          <Text className='text-text font-semibold mb-2'>Reward Type</Text>
          <View className='flex-row flex-wrap'>
            {rewardTypeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => updateFormData('rewardType', option.value)}
                className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                  formData.rewardType === option.value
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}
              >
                <Text
                  className={`font-medium ${
                    formData.rewardType === option.value
                      ? 'text-white'
                      : 'text-text'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Annual Fee */}
        <View className='mb-8'>
          <Text className='text-text font-semibold mb-2'>Annual Fee (₹)</Text>
          <TextInput
            value={formData.annualFee.toString()}
            onChangeText={value =>
              updateFormData('annualFee', parseFloat(value) || 0)
            }
            placeholder='0'
            placeholderTextColor='#9CA3AF'
            className='bg-secondary px-4 py-3 rounded-lg text-text text-base'
            keyboardType='numeric'
          />
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
              <Check size={20} color='white' className='mr-2' />
              <Text className='text-white font-semibold text-lg ml-2'>
                Add Card
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddCardScreen;
