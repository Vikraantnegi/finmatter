/**
 * Edit Benefit Screen
 * Allows users to edit existing card benefit details
 */

import React, { useState, useEffect } from 'react';
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
import { CardBenefit, TransactionCategory } from '@finmatter/types';

// Services
import { cardService } from '../../services/cardService';

// Utils
import { haptics } from '../../utils/haptics';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

interface EditBenefitScreenProps {
  navigation: any;
  route: {
    params: {
      cardId: string;
      benefit: CardBenefit;
      card: any;
    };
  };
}

const EditBenefitScreen: React.FC<EditBenefitScreenProps> = ({
  navigation,
  route,
}) => {
  const { cardId, benefit, card } = route.params;

  const [formData, setFormData] = useState({
    category: benefit.category,
    rewardRate: benefit.rewardRate.toString(),
    rewardCap: benefit.rewardCap?.toString() || '',
    conditions: benefit.conditions
      ? JSON.stringify(benefit.conditions, null, 2)
      : '',
    isActive: benefit.isActive,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      haptics.light();

      const updateData = {
        category: formData.category,
        rewardRate: parseFloat(formData.rewardRate),
        rewardCap: formData.rewardCap
          ? parseFloat(formData.rewardCap)
          : undefined,
        conditions: formData.conditions
          ? JSON.parse(formData.conditions)
          : undefined,
        isActive: formData.isActive,
      };

      const response = await cardService.updateCardBenefit(
        cardId,
        benefit.id,
        updateData,
      );

      if (response.success) {
        showSuccessToast('Success', 'Benefit updated successfully');
        navigation.goBack();
      } else {
        showErrorToast(
          'Error',
          response.error?.message || 'Failed to update benefit',
        );
      }
    } catch (error) {
      console.error('Update benefit error:', error);
      showErrorToast('Error', 'Failed to update benefit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Benefit',
      'Are you sure you want to delete this benefit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await cardService.deleteCardBenefit(
                cardId,
                benefit.id,
              );

              if (response.success) {
                showSuccessToast('Success', 'Benefit deleted successfully');
                navigation.goBack();
              } else {
                showErrorToast('Error', 'Failed to delete benefit');
              }
            } catch (error) {
              console.error('Delete benefit error:', error);
              showErrorToast('Error', 'Failed to delete benefit');
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
        <Text className='text-lg font-semibold text-text'>Edit Benefit</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className='p-2'
        >
          <Save size={24} color='#3B82F6' />
        </TouchableOpacity>
      </View>

      <ScrollView className='flex-1 p-4'>
        {/* Category */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>Category</Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.category}
            onChangeText={text =>
              setFormData({
                ...formData,
                category: text as TransactionCategory,
              })
            }
            placeholder='Enter benefit category'
            placeholderTextColor='#9CA3AF'
          />
        </View>

        {/* Reward Rate */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>
            Reward Rate (%)
          </Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.rewardRate}
            onChangeText={text =>
              setFormData({ ...formData, rewardRate: text })
            }
            placeholder='Enter reward rate'
            placeholderTextColor='#9CA3AF'
            keyboardType='numeric'
          />
        </View>

        {/* Reward Cap */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>
            Reward Cap (Optional)
          </Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.rewardCap}
            onChangeText={text => setFormData({ ...formData, rewardCap: text })}
            placeholder='Enter reward cap'
            placeholderTextColor='#9CA3AF'
            keyboardType='numeric'
          />
        </View>

        {/* Conditions */}
        <View className='mb-4'>
          <Text className='text-sm font-medium text-text mb-2'>
            Conditions (JSON)
          </Text>
          <TextInput
            className='bg-surface border border-border rounded-lg px-4 py-3 text-text'
            value={formData.conditions}
            onChangeText={text =>
              setFormData({ ...formData, conditions: text })
            }
            placeholder='Enter conditions as JSON'
            placeholderTextColor='#9CA3AF'
            multiline
            numberOfLines={4}
            textAlignVertical='top'
          />
        </View>

        {/* Active Status */}
        <View className='mb-6'>
          <TouchableOpacity
            onPress={() =>
              setFormData({ ...formData, isActive: !formData.isActive })
            }
            className='flex-row items-center'
          >
            <View
              className={`w-6 h-6 rounded border-2 mr-3 ${
                formData.isActive
                  ? 'bg-primary border-primary'
                  : 'border-border'
              }`}
            >
              {formData.isActive && (
                <View className='w-full h-full items-center justify-center'>
                  <Text className='text-white text-xs font-bold'>✓</Text>
                </View>
              )}
            </View>
            <Text className='text-text font-medium'>Active</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isLoading}
          className='bg-error/10 border border-error rounded-lg p-4 flex-row items-center justify-center'
        >
          <Trash2 size={20} color='#EF4444' />
          <Text className='text-error font-medium ml-2'>Delete Benefit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditBenefitScreen;
