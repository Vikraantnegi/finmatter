/**
 * Login Screen - Legacy placeholder
 * This screen is no longer used in the phone authentication flow
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

import { theme } from '../../constants/theme';

const LoginScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          This screen is being replaced by the new phone authentication flow.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default LoginScreen;
