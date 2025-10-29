/**
 * Centralized routing utility for authentication and onboarding flows
 * Single source of truth for routing decisions based on auth state
 */

interface AuthRedirectOptions {
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  currentPath: string;
  returnUrl?: string;
}

/**
 * Determines where to redirect user based on authentication state
 * Returns null if user should stay on current page, otherwise returns redirect path
 */
export function getAuthRedirect({
  isAuthenticated,
  onboardingCompleted,
  currentPath,
  returnUrl,
}: AuthRedirectOptions): string | null {
  if (!isAuthenticated) {
    if (currentPath.startsWith('/auth') || currentPath === '/tutorial') {
      return null;
    }

    if (currentPath === '/') {
      return '/tutorial';
    }

    return '/tutorial';
  }

  if (!onboardingCompleted) {
    if (currentPath === '/onboarding') {
      return null;
    }

    if (currentPath.startsWith('/auth')) {
      return '/onboarding';
    }

    if (
      currentPath.startsWith('/dashboard') ||
      currentPath.startsWith('/cards') ||
      currentPath.startsWith('/statements') ||
      currentPath.startsWith('/profile')
    ) {
      return '/onboarding';
    }

    return null;
  }

  if (currentPath.startsWith('/auth')) {
    return returnUrl || '/dashboard';
  }

  if (currentPath === '/onboarding') {
    return null;
  }

  if (currentPath === '/') {
    return '/dashboard';
  }

  return null;
}

/**
 * Checks if a path requires authentication
 */
export function requiresAuth(path: string): boolean {
  const publicPaths = ['/auth/login', '/auth/verify-otp', '/', '/tutorial'];
  return !publicPaths.some(p => path.startsWith(p));
}

/**
 * Checks if a path requires onboarding completion
 */
export function requiresOnboarding(path: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/cards',
    '/statements',
    '/profile',
    '/settings',
  ];
  return protectedPaths.some(p => path.startsWith(p));
}
