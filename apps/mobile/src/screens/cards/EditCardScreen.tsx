/**
 * Edit Card Screen
 * Allows users to edit existing credit card details
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';

// Types
import { Card, CreateCardRequest } from '@finmatter/types';

// Services
import { cardService } from '../../services/cardService';

// Utils
import { haptics } from '../../utils/haptics';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

interface EditCardScreenProps {
  navigation: any;
  route: {
    params: {
      card: Card;
    };
  };
}

const EditCardScreen: React.FC<EditCardScreenProps> = ({
  navigation,
  route,
}) => {
  const { card } = route.params;

  const [formData, setFormData] = useState<CreateCardRequest>({
    cardName: card.cardName,
    bankName: card.bankName,
    lastFourDigits: card.lastFourDigits,
    cardType: card.cardType,
    network: card.network,
    rewardType: card.rewardType,
    annualFee: card.annualFee,
    currency: card.currency,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      haptics.light();

      const response = await cardService.updateCard(card.id, formData);

      if (response.data) {
        showSuccessToast('Success', 'Card updated successfully');
        navigation.goBack();
      } else {
        showErrorToast('Error', 'Failed to update card');
      }
    } catch (error) {
      console.error('Update card error:', error);
      showErrorToast('Error', 'Failed to update card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await cardService.deleteCard(card.id);

              if (response.success) {
                showSuccessToast('Success', 'Card deleted successfully');
                navigation.goBack();
              } else {
                showErrorToast('Error', 'Failed to delete card');
              }
            } catch (error) {
              console.error('Delete card error:', error);
              showErrorToast('Error', 'Failed to delete card');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row items-center justify-between p-4 border-b border-border'>
        <TouchableOpacity onPress={() => navigation.goBack()} className='p-2'>
          <ArrowLeft size={24} color='#374151' />
        </TouchableOpacity>
        <Text className='text-lg font-semibold text-text'>Edit Card</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className='p-2'
        >
          <Save size={24} color='#3B82F6' />
        </TouchableOpacity>
      </View>

      <ScrollView className='flex-1 p-4'>
        {/* Card Name */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>Card Name</Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.cardName}
            onChangeText={text => setFormData({ ...formData, cardName: text })}
            placeholder='Enter card name'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Bank Name */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>Bank Name</Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.bankName}
            onChangeText={text => setFormData({ ...formData, bankName: text })}
            placeholder='Enter bank name'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Last Four Digits */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>
            Last Four Digits
          </Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.lastFourDigits}
            onChangeText={text =>
              setFormData({ ...formData, lastFourDigits: text })
            }
            placeholder='Enter last four digits'
            placeholderTextColor='#9CA3AF'
            keyboardType='numeric'
            maxLength={4}
          />
        </View>

        {/* Card Type */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>Card Type</Text>
          <View className='bg-surface border border-border rounded-lg px-4 py-3'>
            <Text className='text-text'>{formData.cardType}</Text>
          </View>
        </View>

        {/* Network */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>Network</Text>
          <View className='bg-surface border border-border rounded-lg px-4 py-3'>
            <Text className='text-text'>{formData.network}</Text>
          </View>
        </View>

        {/* Reward Type */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>
            Reward Type
          </Text>
          <View className='bg-surface border border-border rounded-lg px-4 py-3'>
            <Text className='text-text'>{formData.rewardType}</Text>
          </View>
        </View>

        {/* Annual Fee */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>Annual Fee</Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.annualFee?.toString() || ''}
            onChangeText={text =>
              setFormData({ ...formData, annualFee: parseFloat(text) || 0 })
            }
            placeholder='Enter annual fee'
            placeholderTextColor='#9CA3AF'
            keyboardType='numeric'
          />
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isLoading}
          className='bg-error/10 border border-error rounded-lg p-4 flex-row items-center justify-center'
        >
          <Trash2 size={20} color='#EF4444' />
          <Text className='text-error font-medium ml-2'>Delete Card</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditCardScreen;
