/**
 * Add Card Screen
 * Two-step card selection: Bank -> Card -> Form
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
import { ArrowLeft, Check, Search, ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

// Types - Note: Some types imported for future use
// import {
//   CreateCardRequest,
//   CardType,
//   CardNetwork,
//   RewardType,
// } from '@finmatter/types';

// Services
import { cardService } from '../../services/cardService';
import { cardSearchService } from '@finmatter/cc-engine';
import type { CardMetadata, BankMetadata } from '@finmatter/cc-engine';

// Utils
import { haptics } from '../../utils/haptics';

interface AddCardScreenProps {
  navigation: any;
  route: any;
}

type SelectionStep = 'bank' | 'card' | 'form';

const AddCardScreen: React.FC<AddCardScreenProps> = ({ navigation }) => {
  // Step management
  const [step, setStep] = useState<SelectionStep>('bank');
  const [selectedBank, setSelectedBank] = useState<BankMetadata | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardMetadata | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form data
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billingDay, setBillingDay] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Get banks with card counts
  const banks = cardSearchService.getBanksWithCardCounts();

  // Filter banks by search
  const filteredBanks = searchQuery
    ? banks.filter((bank: BankMetadata & { cardCount: number }) =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : banks;

  // Get cards for selected bank
  const availableCards = selectedBank
    ? cardSearchService.getCardsByBank(selectedBank.id)
    : [];

  // Filter cards by search
  const filteredCards = searchQuery
    ? availableCards.filter((card: CardMetadata) =>
        card.cardName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : availableCards;

  const handleBankSelect = (bank: BankMetadata) => {
    haptics.selection();
    setSelectedBank(bank);
    setSearchQuery('');
    setStep('card');
  };

  const handleCardSelect = (card: CardMetadata) => {
    haptics.selection();
    setSelectedCard(card);
    setStep('form');
  };

  const handleManualEntry = () => {
    haptics.selection();
    setSelectedCard(null);
    setStep('form');
  };

  const handleBack = () => {
    haptics.selection();
    if (step === 'card') {
      setStep('bank');
      setSelectedBank(null);
      setSearchQuery('');
    } else if (step === 'form') {
      setStep('card');
      setSelectedCard(null);
    } else {
      navigation.goBack();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!lastFourDigits || lastFourDigits.length !== 4) {
      newErrors.lastFourDigits = 'Please enter last 4 digits';
    }

    if (creditLimit && isNaN(parseInt(creditLimit))) {
      newErrors.creditLimit = 'Please enter a valid amount';
    }

    if (billingDay && (parseInt(billingDay) < 1 || parseInt(billingDay) > 31)) {
      newErrors.billingDay = 'Please enter a day between 1-31';
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
      haptics.medium();

      const cardData: any = {
        card_metadata_id: selectedCard?.id || null,
        bank_id: selectedCard?.bankId || selectedBank?.id || 'unknown',
        bank_name:
          selectedCard?.bankId?.toUpperCase() ||
          selectedBank?.name ||
          'Unknown Bank',
        card_name: selectedCard?.cardName || 'Custom Card',
        last_four_digits: lastFourDigits,
        card_type: selectedCard?.cardType || 'credit',
        network: selectedCard?.network || 'visa',
        credit_limit: creditLimit ? parseInt(creditLimit) : null,
        billing_day: billingDay ? parseInt(billingDay) : null,

        // Metadata colors
        primary_color: selectedCard?.primaryColor || '#6B7280',
        secondary_color: selectedCard?.secondaryColor || '#4B5563',
        reward_type: selectedCard?.rewardType || 'none',

        // Flags
        is_custom: !selectedCard,
        is_active: true,
      };

      await cardService.createCard(cardData);

      haptics.success();
      Alert.alert('Success', 'Card added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding card:', error);
      haptics.error();
      Alert.alert(
        'Error',
        error.message || 'Failed to add card. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Render Bank Selection Step
  const renderBankSelection = () => (
    <View className='flex-1'>
      {/* Search Bar */}
      <View className='px-4 pb-4'>
        <View className='flex-row items-center bg-gray-100 rounded-xl px-4 py-3'>
          <Search size={20} color='#6B7280' />
          <TextInput
            className='flex-1 ml-3 text-base'
            placeholder='Search banks...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor='#9CA3AF'
          />
        </View>
      </View>

      {/* Banks Grid */}
      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>
        <View className='flex-row flex-wrap justify-between'>
          {filteredBanks.map((bank: BankMetadata & { cardCount: number }) => (
            <TouchableOpacity
              key={bank.id}
              onPress={() => handleBankSelect(bank)}
              className='w-[48%] mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100'
              activeOpacity={0.7}
            >
              <View className='items-center'>
                {/* Bank Icon Placeholder */}
                <View
                  className='w-16 h-16 rounded-full mb-3 items-center justify-center'
                  style={{ backgroundColor: `${bank.primaryColor}20` }}
                >
                  <Text
                    className='text-2xl font-bold'
                    style={{ color: bank.primaryColor }}
                  >
                    {bank.name.charAt(0)}
                  </Text>
                </View>

                {/* Bank Name */}
                <Text className='text-base font-semibold text-gray-900 text-center mb-1'>
                  {bank.name}
                </Text>

                {/* Card Count */}
                <Text className='text-sm text-gray-500'>
                  {bank.cardCount} {bank.cardCount === 1 ? 'card' : 'cards'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredBanks.length === 0 && (
          <View className='items-center justify-center py-12'>
            <Text className='text-gray-500 text-base'>No banks found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Render Card Selection Step
  const renderCardSelection = () => (
    <View className='flex-1'>
      {/* Bank Header */}
      <View className='px-4 pb-4'>
        <Text className='text-lg font-semibold text-gray-900 mb-1'>
          {selectedBank?.name}
        </Text>
        <Text className='text-sm text-gray-500'>
          Select your card or add manually
        </Text>
      </View>

      {/* Search Bar */}
      <View className='px-4 pb-4'>
        <View className='flex-row items-center bg-gray-100 rounded-xl px-4 py-3'>
          <Search size={20} color='#6B7280' />
          <TextInput
            className='flex-1 ml-3 text-base'
            placeholder='Search cards...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor='#9CA3AF'
          />
        </View>
      </View>

      {/* Cards List */}
      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>
        {filteredCards.map((card: any) => (
          <TouchableOpacity
            key={card.id}
            onPress={() => handleCardSelect(card as CardMetadata)}
            className='mb-4'
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[card.primaryColor, card.secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className='rounded-xl p-4'
            >
              {/* Card Name */}
              <Text className='text-white text-lg font-bold mb-2'>
                {card.cardName}
              </Text>

              {/* Details Row */}
              <View className='flex-row items-center justify-between'>
                <View className='flex-row items-center space-x-3'>
                  {/* Annual Fee */}
                  <View className='bg-white/20 rounded-lg px-3 py-1'>
                    <Text className='text-white text-xs font-medium'>
                      {card.annualFee === 0 ? 'FREE' : `₹${card.annualFee}/yr`}
                    </Text>
                  </View>

                  {/* Reward Type */}
                  <View className='bg-white/20 rounded-lg px-3 py-1'>
                    <Text className='text-white text-xs font-medium capitalize'>
                      {card.rewardType === 'none'
                        ? 'No Rewards'
                        : card.rewardType}
                    </Text>
                  </View>
                </View>

                <ChevronRight size={20} color='white' />
              </View>

              {/* Brief Description */}
              {card.rewardRules.length > 0 && (
                <Text className='text-white/80 text-xs mt-2' numberOfLines={1}>
                  {card.rewardRules[0].category === 'default'
                    ? `${card.rewardRules[0].rewardRate}${
                        card.rewardRules[0].rewardUnit === 'percent' ? '%' : 'x'
                      } rewards`
                    : `${card.rewardRules[0].rewardRate}${
                        card.rewardRules[0].rewardUnit === 'percent' ? '%' : 'x'
                      } on ${card.rewardRules[0].category}`}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {filteredCards.length === 0 && !searchQuery && (
          <View className='items-center justify-center py-8'>
            <Text className='text-gray-500 text-base mb-4'>
              No cards available
            </Text>
          </View>
        )}

        {filteredCards.length === 0 && searchQuery && (
          <View className='items-center justify-center py-8'>
            <Text className='text-gray-500 text-base'>No cards found</Text>
          </View>
        )}

        {/* Manual Entry Button */}
        <TouchableOpacity
          onPress={handleManualEntry}
          className='bg-gray-100 rounded-xl p-4 mb-6 border-2 border-dashed border-gray-300'
          activeOpacity={0.7}
        >
          <Text className='text-gray-700 font-semibold text-center'>
            Don't see your card? Add manually →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Render Form Step
  const renderForm = () => (
    <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>
      {/* Selected Card Preview */}
      {selectedCard && (
        <View className='mb-6'>
          <Text className='text-sm text-gray-600 mb-2'>Selected Card</Text>
          <LinearGradient
            colors={[selectedCard.primaryColor, selectedCard.secondaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className='rounded-xl p-4'
          >
            <Text className='text-white text-lg font-bold'>
              {selectedCard.cardName}
            </Text>
            <Text className='text-white/80 text-sm'>{selectedBank?.name}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Manual Entry Info */}
      {!selectedCard && (
        <View className='mb-6 bg-gray-100 rounded-xl p-4'>
          <Text className='text-sm text-gray-600'>
            Adding custom card for{' '}
            <Text className='font-semibold'>{selectedBank?.name}</Text>
          </Text>
        </View>
      )}

      {/* Last 4 Digits (Required) */}
      <View className='mb-6'>
        <Text className='text-sm font-medium text-gray-700 mb-2'>
          Last 4 Digits <Text className='text-red-500'>*</Text>
        </Text>
        <TextInput
          className='bg-gray-100 rounded-xl px-4 py-3 text-base'
          placeholder='1234'
          value={lastFourDigits}
          onChangeText={setLastFourDigits}
          keyboardType='number-pad'
          maxLength={4}
        />
        {errors.lastFourDigits && (
          <Text className='text-red-500 text-xs mt-1'>
            {errors.lastFourDigits}
          </Text>
        )}
      </View>

      {/* Credit Limit (Optional) */}
      <View className='mb-6'>
        <Text className='text-sm font-medium text-gray-700 mb-2'>
          Credit Limit (Optional)
        </Text>
        <View className='flex-row items-center bg-gray-100 rounded-xl px-4 py-3'>
          <Text className='text-gray-500 mr-2'>₹</Text>
          <TextInput
            className='flex-1 text-base'
            placeholder='50000'
            value={creditLimit}
            onChangeText={setCreditLimit}
            keyboardType='numeric'
          />
        </View>
        {errors.creditLimit && (
          <Text className='text-red-500 text-xs mt-1'>
            {errors.creditLimit}
          </Text>
        )}
      </View>

      {/* Billing Day (Optional) */}
      <View className='mb-6'>
        <Text className='text-sm font-medium text-gray-700 mb-2'>
          Billing Day (Optional)
        </Text>
        <TextInput
          className='bg-gray-100 rounded-xl px-4 py-3 text-base'
          placeholder='Day of month (1-31)'
          value={billingDay}
          onChangeText={setBillingDay}
          keyboardType='number-pad'
          maxLength={2}
        />
        {errors.billingDay && (
          <Text className='text-red-500 text-xs mt-1'>{errors.billingDay}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className='bg-blue-600 rounded-xl py-4 mb-6'
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color='white' />
        ) : (
          <View className='flex-row items-center justify-center'>
            <Check size={20} color='white' />
            <Text className='text-white font-semibold text-base ml-2'>
              Add Card
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView className='flex-1 bg-white'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-4 py-3 border-b border-gray-200'>
        <TouchableOpacity
          onPress={handleBack}
          className='p-2'
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color='#111827' />
        </TouchableOpacity>

        <Text className='text-lg font-semibold text-gray-900'>
          {step === 'bank' && 'Select Bank'}
          {step === 'card' && 'Select Card'}
          {step === 'form' && 'Card Details'}
        </Text>

        <View className='w-10' />
      </View>

      {/* Step Indicator */}
      <View className='flex-row items-center px-4 py-3 bg-gray-50'>
        <View
          className={`flex-1 h-1 rounded ${
            step === 'bank' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
        <View
          className={`flex-1 h-1 rounded mx-2 ${
            step === 'card' || step === 'form' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
        <View
          className={`flex-1 h-1 rounded ${
            step === 'form' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
      </View>

      {/* Content */}
      {step === 'bank' && renderBankSelection()}
      {step === 'card' && renderCardSelection()}
      {step === 'form' && renderForm()}
    </SafeAreaView>
  );
};

export default AddCardScreen;
