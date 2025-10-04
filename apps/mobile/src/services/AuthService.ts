/**
 * Authentication Service
 * Handles API calls for authentication
 */

import { apiClient } from '@finmatter/shared';
import type { User, UserSession } from '@finmatter/types';

class AuthService {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; session: UserSession }> {
    const response = await apiClient.post<{ user: User; session: UserSession }>(
      '/auth/login',
      {
        email,
        password,
      },
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  }

  async signup(
    email: string,
    password: string,
    userData?: Partial<User>,
  ): Promise<{ user: User; session: UserSession }> {
    const response = await apiClient.post<{ user: User; session: UserSession }>(
      '/auth/signup',
      {
        email,
        password,
        ...userData,
      },
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  }

  async logout(token: string): Promise<void> {
    await apiClient.post('/auth/logout', undefined, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async refreshToken(refreshToken: string): Promise<{ session: UserSession }> {
    const response = await apiClient.post<{ session: UserSession }>(
      '/auth/refresh',
      {
        refreshToken,
      },
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    await apiClient.post('/auth/resend-verification', { email });
  }
}

export const authService = new AuthService();
