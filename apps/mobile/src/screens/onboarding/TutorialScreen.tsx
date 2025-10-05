/**
 * Tutorial Screen (Optional but Recommended)
 * Swipeable carousel showing app features
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../constants/theme';

interface TutorialScreenProps {
  navigation: any;
  route: any;
}

const { width: screenWidth } = Dimensions.get('window');

interface TutorialSlide {
  icon: string;
  title: string;
  description: string;
}

const tutorialSlides: TutorialSlide[] = [
  {
    icon: '💳',
    title: 'Know Which Card to Use',
    description: 'Get instant recommendations for every purchase',
  },
  {
    icon: '📊',
    title: 'Track Your Spending',
    description: 'See where your money goes, organized automatically',
  },
  {
    icon: '🤖',
    title: 'AI Financial Assistant',
    description: 'Ask anything about your finances, get instant answers',
  },
  {
    icon: '🎯',
    title: 'Maximize Rewards',
    description: 'Never miss cashback or points again',
  },
];

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
  navigation,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const slideSize = screenWidth;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      scrollViewRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      });
      setCurrentSlide(nextSlide);
    } else {
      // Last slide - go to Add First Card
      navigation.navigate('AddFirstCard');
    }
  };

  const handleSkip = () => {
    navigation.navigate('AddFirstCard');
  };

  const renderSlide = (slide: TutorialSlide, index: number) => (
    <View key={index} style={styles.slide}>
      <View style={styles.slideContent}>
        <Text style={styles.slideIcon}>{slide.icon}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {tutorialSlides.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            index === currentSlide && styles.activeDot,
          ]}
          onPress={() => {
            scrollViewRef.current?.scrollTo({
              x: index * screenWidth,
              animated: true,
            });
            setCurrentSlide(index);
          }}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}>
        {tutorialSlides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Dots */}
      {renderDots()}

      {/* Next/Get Started Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.buttonGradient}>
            <Text style={styles.nextButtonText}>
              {currentSlide === tutorialSlides.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: theme.spacing.lg,
    zIndex: 1,
    padding: theme.spacing.sm,
  },
  skipButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  slideIcon: {
    fontSize: 80,
    marginBottom: theme.spacing.xl,
  },
  slideTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  slideDescription: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  nextButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default TutorialScreen;
