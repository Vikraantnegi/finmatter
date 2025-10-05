/**
 * SMS Permission Screen (Android Only)
 * Requests SMS permission for auto-reading OTPs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../constants/theme';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

interface SMSPermissionScreenProps {
  navigation: any;
  route: any;
}

export const SMSPermissionScreen: React.FC<SMSPermissionScreenProps> = ({
  navigation,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Skip this screen on iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      navigation.navigate('Tutorial');
    }
  }, [navigation]);

  const handleAllowAccess = async () => {
    setIsLoading(true);

    try {
      const result = await request(PERMISSIONS.ANDROID.READ_SMS);

      if (result === RESULTS.GRANTED) {
        showSuccessToast(
          'SMS Access Granted',
          'We\'ll automatically read OTPs for faster login',
        );
        
        // Store permission status in auth store
        // TODO: Update authStore with SMS permission
        setTimeout(() => {
          navigation.navigate('Tutorial');
        }, 1500);
      } else if (result === RESULTS.DENIED) {
        showErrorToast(
          'Permission Denied',
          'You can enable SMS access later in settings',
        );
        navigation.navigate('Tutorial');
      } else {
        // Blocked or other
        navigation.navigate('Tutorial');
      }
    } catch (error) {
      console.error('SMS permission error:', error);
      showErrorToast('Error', 'Failed to request SMS permission');
      navigation.navigate('Tutorial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Tutorial');
  };

  // Don't render anything on iOS since we skip this screen
  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💬</Text>
          </View>
          <Text style={styles.title}>Auto-read OTPs</Text>
          <Text style={styles.description}>
            We'll automatically read OTPs from your SMS for faster login. Your messages stay private.
          </Text>
          
          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 We only read banking OTPs, not personal messages
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAllowAccess}
            disabled={isLoading}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Requesting...' : 'Allow Access'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  icon: {
    fontSize: 40,
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
    marginBottom: theme.spacing.lg,
  },
  privacyNote: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  privacyText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: theme.spacing.md,
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
});

export default SMSPermissionScreen;
