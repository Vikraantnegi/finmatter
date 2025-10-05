/**
 * Add First Card Prompt Screen
 * Final onboarding screen - prompts user to add their first credit card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../constants/theme';
import { showSuccessToast } from '../../utils/toast';

interface AddFirstCardScreenProps {
  navigation: any;
  route: any;
}

// Check if we're in development mode
const isDev = __DEV__;

export const AddFirstCardScreen: React.FC<AddFirstCardScreenProps> = ({
  navigation,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCard = () => {
    // TODO: Navigate to AddCardScreen when it's implemented
    // For now, show a message and go to home
    showSuccessToast(
      'Coming Soon',
      'Card management will be available in the next update!',
    );
    
    // Complete onboarding and go to main app
    setTimeout(() => {
      completeOnboarding();
    }, 1500);
  };

  const handleLater = () => {
    if (isDev) {
      // Only allow skipping in development mode
      showSuccessToast(
        'Skipped',
        'You can add cards later from the Cards tab',
      );
      
      // Complete onboarding and go to main app
      setTimeout(() => {
        completeOnboarding();
      }, 1000);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Update authStore to mark onboarding as completed
      // await authService.completeOnboarding();
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Onboarding completion error:', error);
      // Still navigate to main app even if API fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustration}>💳</Text>
            <View style={styles.cardStack}>
              <View style={[styles.card, styles.card1]} />
              <View style={[styles.card, styles.card2]} />
              <View style={[styles.card, styles.card3]} />
            </View>
          </View>
          
          <Text style={styles.title}>Add Your First Card</Text>
          <Text style={styles.description}>
            We need at least one credit card to start optimizing your spending
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddCard}
            disabled={isLoading}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Setting up...' : 'Add Card'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Only show "Later" button in development mode */}
          {isDev && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleLater}
              disabled={isLoading}>
              <Text style={styles.skipButtonText}>I'll do this later</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 You can add more cards later from the Cards tab
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xl,
  },
  illustration: {
    fontSize: 80,
    zIndex: 3,
  },
  cardStack: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 60,
  },
  card: {
    position: 'absolute',
    width: 40,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  card1: {
    backgroundColor: theme.colors.primaryLight,
    zIndex: 1,
  },
  card2: {
    backgroundColor: theme.colors.primary,
    top: 2,
    left: 2,
    zIndex: 2,
  },
  card3: {
    backgroundColor: theme.colors.primaryDark,
    top: 4,
    left: 4,
    zIndex: 3,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
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
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  skipButtonText: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AddFirstCardScreen;
