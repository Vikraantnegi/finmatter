/**
 * Card Detail Screen
 * Shows detailed information about a specific card including benefits
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Edit, Trash2, Plus, Gift } from 'lucide-react-native';

// Types
import { Card, CardBenefit } from '@finmatter/types';

// Components
import CreditCardVisual from '../../components/cards/CreditCardVisual';
import BenefitItem from '../../components/cards/BenefitItem';

// Services
import { cardService } from '../../services/cardService';

// Utils
import { haptics } from '../../utils/haptics';

interface CardDetailScreenProps {
  navigation: any;
  route: {
    params: {
      cardId: string;
      card?: Card;
    };
  };
}

const CardDetailScreen: React.FC<CardDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { cardId, card: initialCard } = route.params;
  const [card, setCard] = useState<Card | null>(initialCard || null);
  const [benefits, setBenefits] = useState<CardBenefit[]>([]);
  const [loading, setLoading] = useState(!initialCard);
  const [benefitsLoading, setBenefitsLoading] = useState(true);

  useEffect(() => {
    if (!initialCard) {
      fetchCardDetails();
    }
    fetchBenefits();
  }, [cardId]);

  const fetchCardDetails = async () => {
    try {
      setLoading(true);
      const response = await cardService.getCard(cardId);

      if (response.success && response.data) {
        setCard(response.data.card);
      } else {
        Alert.alert('Error', 'Failed to fetch card details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Fetch card error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchBenefits = async () => {
    try {
      setBenefitsLoading(true);
      const response = await cardService.getCardBenefits(cardId);

      if (response.success && response.data) {
        setBenefits(response.data.benefits);
      }
    } catch (error) {
      console.error('Fetch benefits error:', error);
    } finally {
      setBenefitsLoading(false);
    }
  };

  const handleEditCard = () => {
    haptics.light();
    navigation.navigate('EditCard', { card });
  };

  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${card?.cardName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.success();
              await cardService.deleteCard(cardId);
              Alert.alert('Success', 'Card deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Delete card error:', error);
              Alert.alert('Error', 'Failed to delete card');
            }
          },
        },
      ],
    );
  };

  const handleAddBenefit = () => {
    haptics.light();
    navigation.navigate('AddBenefit', { cardId, card });
  };

  const handleEditBenefit = (benefit: CardBenefit) => {
    haptics.light();
    navigation.navigate('EditBenefit', { cardId, benefit, card });
  };

  const handleDeleteBenefit = (benefit: CardBenefit) => {
    Alert.alert(
      'Delete Benefit',
      `Are you sure you want to delete the ${benefit.category} benefit?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.success();
              await cardService.deleteCardBenefit(cardId, benefit.id);
              await fetchBenefits();
            } catch (error) {
              console.error('Delete benefit error:', error);
              Alert.alert('Error', 'Failed to delete benefit');
            }
          },
        },
      ],
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text className='text-text-secondary mt-4'>
            Loading card details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 justify-center items-center p-8'>
          <Text className='text-red-500 text-lg font-semibold mb-2'>Error</Text>
          <Text className='text-text-secondary text-center mb-6'>
            Card not found
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className='bg-primary px-6 py-3 rounded-lg'
          >
            <Text className='text-white font-semibold'>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text className='text-xl font-bold text-text'>Card Details</Text>
        <View className='flex-row space-x-2'>
          <TouchableOpacity
            onPress={handleEditCard}
            className='p-2'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Edit size={20} color='#374151' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteCard}
            className='p-2'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={20} color='#EF4444' />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        {/* Card Visual */}
        <View className='px-4 py-6'>
          <CreditCardVisual card={card} showActions={false} />
        </View>

        {/* Card Information */}
        <View className='px-4 mb-6'>
          <Text className='text-xl font-bold text-text mb-4'>
            Card Information
          </Text>

          <View className='bg-secondary rounded-lg p-4 space-y-3'>
            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Bank</Text>
              <Text className='text-text font-medium'>{card.bankName}</Text>
            </View>

            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Card Name</Text>
              <Text className='text-text font-medium'>{card.cardName}</Text>
            </View>

            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Type</Text>
              <Text className='text-text font-medium capitalize'>
                {card.cardType}
              </Text>
            </View>

            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Network</Text>
              <Text className='text-text font-medium capitalize'>
                {card.network}
              </Text>
            </View>

            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Reward Type</Text>
              <Text className='text-text font-medium capitalize'>
                {card.rewardType}
              </Text>
            </View>

            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Annual Fee</Text>
              <Text className='text-text font-medium'>
                {formatCurrency(card.annualFee)}
              </Text>
            </View>

            <View className='flex-row justify-between'>
              <Text className='text-text-secondary'>Status</Text>
              <Text
                className={`font-medium capitalize ${
                  card.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {card.status}
              </Text>
            </View>

            {card.issueDate && (
              <View className='flex-row justify-between'>
                <Text className='text-text-secondary'>Issue Date</Text>
                <Text className='text-text font-medium'>
                  {formatDate(card.issueDate.toString())}
                </Text>
              </View>
            )}

            {card.expiryDate && (
              <View className='flex-row justify-between'>
                <Text className='text-text-secondary'>Expiry Date</Text>
                <Text className='text-text font-medium'>
                  {formatDate(card.expiryDate.toString())}
                </Text>
              </View>
            )}

            {card.creditLimit && (
              <View className='flex-row justify-between'>
                <Text className='text-text-secondary'>Credit Limit</Text>
                <Text className='text-text font-medium'>
                  {formatCurrency(card.creditLimit)}
                </Text>
              </View>
            )}

            {card.availableCredit && (
              <View className='flex-row justify-between'>
                <Text className='text-text-secondary'>Available Credit</Text>
                <Text className='text-text font-medium'>
                  {formatCurrency(card.availableCredit)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Usage Stats Section */}
        <View className='px-4 mb-6'>
          <Text className='text-xl font-bold text-text mb-4'>
            Usage Statistics
          </Text>
          <View className='bg-secondary rounded-lg p-4'>
            <View className='flex-row justify-between items-center mb-3'>
              <Text className='text-text-secondary'>Total Transactions</Text>
              <Text className='text-text font-semibold'>0</Text>
            </View>
            <View className='flex-row justify-between items-center mb-3'>
              <Text className='text-text-secondary'>Total Spent</Text>
              <Text className='text-text font-semibold'>₹0</Text>
            </View>
            <View className='flex-row justify-between items-center mb-3'>
              <Text className='text-text-secondary'>Rewards Earned</Text>
              <Text className='text-text font-semibold'>₹0</Text>
            </View>
            <View className='flex-row justify-between items-center'>
              <Text className='text-text-secondary'>Average Monthly Spend</Text>
              <Text className='text-text font-semibold'>₹0</Text>
            </View>
            <View className='mt-3 pt-3 border-t border-border'>
              <Text className='text-text-secondary text-sm text-center'>
                Statistics will be available after uploading statements
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View className='px-4 mb-6'>
          <View className='flex-row items-center justify-between mb-4'>
            <Text className='text-xl font-bold text-text'>Benefits</Text>
            <TouchableOpacity
              onPress={handleAddBenefit}
              className='flex-row items-center bg-primary px-4 py-2 rounded-lg'
            >
              <Plus size={16} color='white' />
              <Text className='text-white font-medium ml-2'>Add Benefit</Text>
            </TouchableOpacity>
          </View>

          {benefitsLoading ? (
            <View className='flex-row justify-center py-8'>
              <ActivityIndicator size='small' color='#3B82F6' />
            </View>
          ) : benefits.length > 0 ? (
            <View className='space-y-3'>
              {benefits.map(benefit => (
                <BenefitItem
                  key={benefit.id}
                  benefit={benefit}
                  onEdit={() => handleEditBenefit(benefit)}
                  onDelete={() => handleDeleteBenefit(benefit)}
                />
              ))}
            </View>
          ) : (
            <View className='bg-secondary rounded-lg p-8 items-center'>
              <Gift size={48} color='#9CA3AF' />
              <Text className='text-text-secondary text-center mt-4 mb-2'>
                No benefits added yet
              </Text>
              <Text className='text-text-secondary text-center text-sm'>
                Add benefits to track reward rates for different spending
                categories
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardDetailScreen;
