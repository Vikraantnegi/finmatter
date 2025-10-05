/**
 * Theme configuration for FinMatter mobile app
 */

export const theme = {
  colors: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    secondary: '#8B5CF6',
    secondaryDark: '#7C3AED',
    secondaryLight: '#A78BFA',
    success: '#10B981',
    successDark: '#059669',
    successLight: '#34D399',
    warning: '#F59E0B',
    warningDark: '#D97706',
    warningLight: '#FBBF24',
    error: '#EF4444',
    errorDark: '#DC2626',
    errorLight: '#F87171',
    info: '#06B6D4',
    infoDark: '#0891B2',
    infoLight: '#22D3EE',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    onBackground: '#0F172A',
    onSurface: '#1E293B',
    onSurfaceVariant: '#475569',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderDark: '#CBD5E1',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textDisabled: '#CBD5E1',
    disabled: '#CBD5E1',
    errorBackground: '#FEF2F2',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      light: '300' as const,
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    h6: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 26,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animation: {
    timing: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

export type Theme = typeof theme;
