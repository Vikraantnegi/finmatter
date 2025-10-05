/**
 * Welcome/Name Input Screen
 * First screen after biometric setup - collects user's name
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../constants/theme';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { authService } from '../../services/AuthService';

interface WelcomeScreenProps {
  navigation: any;
  route: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  navigation,
}) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateName = (inputName: string): boolean => {
    const trimmedName = inputName.trim();
    return trimmedName.length >= 2 && /^[a-zA-Z\s]+$/.test(trimmedName);
  };

  const handleContinue = async () => {
    if (!validateName(name)) {
      showErrorToast(
        'Invalid Name',
        'Please enter a valid name (at least 2 characters, letters only).',
      );
      return;
    }

    setIsLoading(true);

    try {
      // Update user profile via API
      const response = await authService.updateUserProfile({
        name: name.trim(),
      });

      if (response.success) {
        showSuccessToast(
          'Welcome!',
          `Nice to meet you, ${name.trim()}!`,
        );
        
        // Navigate to next onboarding screen
        setTimeout(() => {
          navigation.navigate('NotificationPermission');
        }, 1500);
      } else {
        showErrorToast(
          'Profile Update Failed',
          response.error || 'Failed to update profile. Please try again.',
        );
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showErrorToast(
        'Network Error',
        'Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isNameValid = validateName(name);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>Welcome to FinMatter!</Text>
            <Text style={styles.subtitle}>
              Let's get you set up in 2 minutes
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder="What should we call you?"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {name.length > 0 && !isNameValid && (
              <Text style={styles.errorText}>
                Name must be at least 2 characters, letters only
              </Text>
            )}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!isNameValid || isLoading) && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!isNameValid || isLoading}>
            <LinearGradient
              colors={
                isNameValid && !isLoading
                  ? [theme.colors.primary, theme.colors.primaryDark]
                  : [theme.colors.disabled, theme.colors.disabled]
              }
              style={styles.buttonGradient}>
              <Text style={styles.buttonText}>
                {isLoading ? 'Setting up...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
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
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  nameInput: {
    ...theme.typography.h3,
    color: theme.colors.text,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    textAlign: 'center',
  },
  continueButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default WelcomeScreen;
