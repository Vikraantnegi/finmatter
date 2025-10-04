/**
 * Loading Screen
 * Shows while app is initializing
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { theme } from '../constants/theme';

const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>FinMatter</Text>
          <Text style={styles.subtitle}>Personal Finance Super App</Text>
          <ActivityIndicator
            size="large"
            color={theme.colors.white}
            style={styles.loader}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.xl,
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
});

export default LoadingScreen;
