/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Credit Card Visual Component
 * Displays a credit card with animated gradient and card details
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Eye, EyeOff, MoreVertical, Trash2 } from 'lucide-react-native';
import { Card as CardType, CardNetwork, RewardType } from '@finmatter/types';

interface CreditCardVisualProps {
  card: CardType;
  onDelete?: () => void;
  showActions?: boolean;
}

const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  card,
  onDelete,
  showActions = true,
}) => {
  const [showNumber, setShowNumber] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Animation refs
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Animate card entrance
  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1.02,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleNumberVisibility = () => {
    // Flip animation
    Animated.sequence([
      Animated.timing(flipAnimation, {
        toValue: showNumber ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setShowNumber(!showNumber);
  };

  const toggleActionsMenu = () => {
    Animated.spring(scaleAnimation, {
      toValue: showActionsMenu ? 1 : 0.98,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    setShowActionsMenu(!showActionsMenu);
  };

  // Animation interpolations
  const flipInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const slideInterpolate = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const frontAnimatedStyle = {
    transform: [
      { rotateY: flipInterpolate },
      { scale: scaleAnimation },
      { translateY: slideInterpolate },
    ],
    opacity: fadeAnimation,
  };

  // const backAnimatedStyle = {
  //   transform: [{ rotateY: flipInterpolate }, { scale: scaleAnimation }],
  //   opacity: flipAnimation.interpolate({
  //     inputRange: [0, 0.5, 1],
  //     outputRange: [0, 0, 1],
  //   }),
  // };

  const getCardGradient = (network: CardNetwork, bankName: string) => {
    // Bank-specific gradients
    const bankGradients = {
      HDFC: ['#1E3A8A', '#3B82F6'],
      ICICI: ['#059669', '#10B981'],
      SBI: ['#DC2626', '#EF4444'],
      Axis: ['#7C3AED', '#8B5CF6'],
      Kotak: ['#EA580C', '#F97316'],
    };

    // Network-specific gradients as fallback
    const networkGradients = {
      visa: ['#1E3A8A', '#3B82F6'],
      mastercard: ['#DC2626', '#EF4444'],
      amex: ['#059669', '#10B981'],
      rupay: ['#7C3AED', '#8B5CF6'],
      discover: ['#EA580C', '#F97316'],
    };

    return (
      bankGradients[bankName as keyof typeof bankGradients] ||
      networkGradients[network] || ['#374151', '#6B7280']
    );
  };

  const getNetworkLogo = (network: CardNetwork) => {
    switch (network) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'AMEX';
      case 'rupay':
        return 'RuPay';
      case 'discover':
        return 'Discover';
      default:
        return (network as string)?.toUpperCase();
    }
  };

  const getRewardTypeIcon = (rewardType: RewardType) => {
    switch (rewardType) {
      case 'cashback':
        return '₹';
      case 'points':
        return '★';
      case 'miles':
        return '✈';
      case 'none':
        return '';
      default:
        return '';
    }
  };

  const gradient = getCardGradient(card.network, card.bankName);

  return (
    <View className='relative'>
      {/* Card Container */}
      <Animated.View
        className='rounded-2xl shadow-lg overflow-hidden'
        style={frontAnimatedStyle}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='p-6'
        >
          {/* Card Header */}
          <View className='flex-row justify-between items-start mb-6'>
            <View className='flex-1'>
              <Text className='text-white/80 text-sm font-medium mb-1'>
                {card.bankName}
              </Text>
              <Text className='text-white text-lg font-bold'>
                {card.cardName}
              </Text>
            </View>

            {showActions && (
              <View className='relative'>
                <TouchableOpacity
                  onPress={toggleActionsMenu}
                  className='p-2'
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MoreVertical size={20} color='white' />
                </TouchableOpacity>

                {showActionsMenu && (
                  <View className='absolute top-10 right-0 bg-white rounded-lg shadow-lg z-10 min-w-[120px]'>
                    <TouchableOpacity
                      onPress={() => {
                        setShowActionsMenu(false);
                        onDelete?.();
                      }}
                      className='flex-row items-center px-4 py-3 border-b border-gray-100'
                    >
                      <Trash2 size={16} color='#EF4444' />
                      <Text className='text-red-500 ml-2 font-medium'>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Card Number */}
          <View className='flex-row items-center justify-between mb-6'>
            <View className='flex-row items-center'>
              <Text className='text-white text-2xl font-mono tracking-wider'>
                •••• •••• •••• {showNumber ? card.lastFourDigits : '••••'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleNumberVisibility}
              className='p-1'
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              {showNumber ? (
                <EyeOff size={20} color='white' />
              ) : (
                <Eye size={20} color='white' />
              )}
            </TouchableOpacity>
          </View>

          {/* Card Footer */}
          <View className='flex-row justify-between items-end'>
            <View>
              <Text className='text-white/80 text-xs font-medium mb-1'>
                {card.cardType.toUpperCase()}
              </Text>
              <Text className='text-white/80 text-xs'>
                {card.rewardType !== 'none' && (
                  <>
                    {getRewardTypeIcon(card.rewardType)}{' '}
                    {card.rewardType.toUpperCase()}
                  </>
                )}
              </Text>
            </View>

            <View className='items-end'>
              <Text className='text-white text-lg font-bold'>
                {getNetworkLogo(card.network)}
              </Text>
              <Text className='text-white/80 text-xs'>
                {card.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Benefits Summary */}
      {card.benefits && card.benefits.length > 0 && (
        <Animated.View
          className='mt-3 px-2'
          style={{
            opacity: slideAnimation,
            transform: [
              {
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <Text className='text-text-secondary text-sm mb-2'>
            Key Benefits:
          </Text>
          <View className='flex-row flex-wrap'>
            {card.benefits.slice(0, 3).map(benefit => (
              <Animated.View
                key={benefit.id}
                className='bg-primary/10 px-3 py-1 rounded-full mr-2 mb-2'
                style={{
                  opacity: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      scale: slideAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <Text className='text-primary text-xs font-medium'>
                  {benefit.rewardRate}% {benefit.category}
                </Text>
              </Animated.View>
            ))}
            {card.benefits.length > 3 && (
              <Animated.View
                className='bg-secondary px-3 py-1 rounded-full'
                style={{
                  opacity: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      scale: slideAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <Text className='text-text-secondary text-xs'>
                  +{card.benefits.length - 3} more
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default CreditCardVisual;
