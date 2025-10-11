/**
 * Cookie utilities for storing and retrieving authentication tokens
 */

const AUTH_COOKIE_NAME = 'finmatter-auth-token';

// Cookie options for access tokens
const ACCESS_TOKEN_OPTIONS = {
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  httpOnly: false, // Need client-side access for API calls
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * Set a cookie with the given name and value
 */
export function setCookie(name: string, value: string, options: any = {}) {
  if (typeof document === 'undefined') return; // SSR safety

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (options.maxAge) {
    cookieString += `; Max-Age=${options.maxAge}`;
  }

  if (options.path) {
    cookieString += `; Path=${options.path}`;
  }

  if (options.secure) {
    cookieString += `; Secure`;
  }

  // Note: HttpOnly cannot be set from client-side JavaScript
  // if (options.httpOnly) {
  //   cookieString += `; HttpOnly`;
  // }

  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null; // SSR safety

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path: string = '/') {
  if (typeof document === 'undefined') return; // SSR safety

  document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

/**
 * Auth token cookie functions
 * Note: Refresh tokens are set as httpOnly by the server and cannot be accessed client-side
 */
export const authCookies = {
  /**
   * Set access token cookie (client-side accessible)
   */
  setAccessToken: (accessToken: string) => {
    setCookie(AUTH_COOKIE_NAME, accessToken, ACCESS_TOKEN_OPTIONS);
  },

  /**
   * Get access token from cookie
   */
  getAccessToken: (): string | null => {
    return getCookie(AUTH_COOKIE_NAME);
  },

  /**
   * @deprecated Refresh token is httpOnly and cannot be accessed client-side
   * This method is kept for backwards compatibility but will always return null
   * The server handles refresh tokens via httpOnly cookies automatically
   */
  getRefreshToken: (): string | null => {
    // Cannot access httpOnly cookies from client-side JavaScript
    // This is intentional for security (prevents XSS attacks)
    return null;
  },

  /**
   * Clear all auth cookies
   * Note: This only clears client-accessible cookies
   * HttpOnly refresh token cookie must be cleared by server
   */
  clearTokens: () => {
    deleteCookie(AUTH_COOKIE_NAME);
    deleteCookie('finmatter-refresh-token'); // Try to clear, but won't work if httpOnly
    // Server will invalidate httpOnly token or it will expire naturally
  },

  /**
   * @deprecated Use setAccessToken instead
   * Kept for backwards compatibility
   */
  setTokens: (accessToken: string, _refreshToken?: string) => {
    setCookie(AUTH_COOKIE_NAME, accessToken, ACCESS_TOKEN_OPTIONS);
    // Don't set refresh token client-side - server sets it as httpOnly
  },
};
