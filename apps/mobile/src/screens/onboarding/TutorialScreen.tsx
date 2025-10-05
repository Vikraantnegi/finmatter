/**
 * Quick Tutorial Screen
 * Brief introduction to FinMatter's key features
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';

interface TutorialScreenProps {
  navigation: any;
  route: any;
}

const { width: screenWidth } = Dimensions.get('window');

interface TutorialSlide {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const tutorialSlides: TutorialSlide[] = [
  {
    id: 1,
    title: 'Track Your Cards',
    description:
      'Add your credit cards and track spending across all your accounts in one place.',
    icon: '💳',
    color: 'bg-primary',
  },
  {
    id: 2,
    title: 'Smart Insights',
    description:
      'Get personalized insights and recommendations to optimize your spending and savings.',
    icon: '📊',
    color: 'bg-secondary',
  },
  {
    id: 3,
    title: 'Goal Tracking',
    description:
      'Set financial goals and track your progress with visual charts and milestones.',
    icon: '🎯',
    color: 'bg-success',
  },
  {
    id: 4,
    title: 'Optimize Spending',
    description:
      'Discover which cards to use for maximum rewards and cashback on every purchase.',
    icon: '⚡',
    color: 'bg-warning',
  },
];

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
  navigation,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const handleNext = () => {
    if (currentPage < tutorialSlides.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      pagerRef.current?.setPage(nextPage);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      pagerRef.current?.setPage(prevPage);
    }
  };

  const handleFinish = () => {
    navigation.navigate('AddFirstCard');
  };

  const handleSkip = () => {
    navigation.navigate('AddFirstCard');
  };

  const renderSlide = (slide: TutorialSlide) => (
    <View
      key={slide.id}
      className='flex-1 justify-center items-center px-8'
      style={{ width: screenWidth }}
    >
      {/* Icon Section */}
      <View
        className={`w-40 h-40 ${slide.color}/10 rounded-full items-center justify-center mb-8`}
      >
        <Text className='text-8xl'>{slide.icon}</Text>
      </View>

      {/* Content Section */}
      <View className='items-center'>
        <Text className='text-3xl font-bold text-text text-center mb-4'>
          {slide.title}
        </Text>
        <Text className='text-lg text-text-secondary text-center leading-7'>
          {slide.description}
        </Text>
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View className='flex-row justify-center items-center mb-8'>
      {tutorialSlides.map((_, index) => (
        <View
          key={index}
          className={`w-2 h-2 rounded-full mx-1 ${
            index === currentPage ? 'bg-primary' : 'bg-border'
          }`}
        />
      ))}
    </View>
  );

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row justify-between items-center px-6 py-4'>
        <TouchableOpacity onPress={handleSkip}>
          <Text className='text-base font-medium text-text-secondary'>
            Skip
          </Text>
        </TouchableOpacity>

        <Text className='text-base font-medium text-text'>
          {currentPage + 1} of {tutorialSlides.length}
        </Text>

        <View className='w-10' />
      </View>

      {/* Tutorial Content */}
      <View className='flex-1'>
        <PagerView
          ref={pagerRef}
          className='flex-1'
          initialPage={0}
          onPageSelected={(e: any) => setCurrentPage(e.nativeEvent.position)}
        >
          {tutorialSlides.map(renderSlide)}
        </PagerView>

        {/* Pagination Dots */}
        {renderPaginationDots()}
      </View>

      {/* Navigation Buttons */}
      <View className='px-6 pb-8'>
        <View className='flex-row justify-between items-center'>
          {/* Previous Button */}
          <TouchableOpacity
            className={`py-3 px-6 rounded-md ${
              currentPage > 0 ? 'bg-surface border border-border' : 'opacity-0'
            }`}
            onPress={handlePrevious}
            disabled={currentPage === 0}
          >
            <Text
              className={`text-base font-medium ${
                currentPage > 0 ? 'text-primary' : 'text-transparent'
              }`}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {/* Next/Finish Button */}
          <TouchableOpacity
            className='bg-primary py-3 px-8 rounded-md'
            onPress={
              currentPage === tutorialSlides.length - 1
                ? handleFinish
                : handleNext
            }
          >
            <Text className='text-white text-base font-semibold'>
              {currentPage === tutorialSlides.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TutorialScreen;
