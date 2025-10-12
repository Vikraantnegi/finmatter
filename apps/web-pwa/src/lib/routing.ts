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
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // Already on auth pages - stay there
    if (currentPath.startsWith('/auth')) {
      return null;
    }
    // Redirect to login for all other pages
    return '/auth/login';
  }

  // Authenticated but not onboarded - redirect to onboarding
  if (!onboardingCompleted) {
    // Already on onboarding page - stay there
    if (currentPath === '/onboarding') {
      return null;
    }

    // On auth pages - go to onboarding (user just logged in)
    if (currentPath.startsWith('/auth')) {
      return '/onboarding';
    }

    // Trying to access protected pages without completing onboarding
    if (
      currentPath.startsWith('/dashboard') ||
      currentPath.startsWith('/cards') ||
      currentPath.startsWith('/statements') ||
      currentPath.startsWith('/profile')
    ) {
      return '/onboarding';
    }

    // Allow access to root and other public pages
    return null;
  }

  // Fully authenticated and onboarded
  // Redirect from auth pages to dashboard or return URL
  if (currentPath.startsWith('/auth')) {
    return returnUrl || '/dashboard';
  }

  // Don't auto-redirect from onboarding page - let the onboarding completion handle navigation
  // This prevents race conditions between AuthGuard and onboarding completion
  if (currentPath === '/onboarding') {
    return null;
  }

  // Redirect from root to dashboard
  if (currentPath === '/') {
    return '/dashboard';
  }

  // Stay on current page for all other routes
  return null;
}

/**
 * Checks if a path requires authentication
 */
export function requiresAuth(path: string): boolean {
  const publicPaths = ['/auth/login', '/auth/verify-otp', '/'];
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
