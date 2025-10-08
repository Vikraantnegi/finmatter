/* eslint-disable no-console */
/**
 * API Client Service
 * Handles all API communication with authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { storageService } from '../lib/storage';

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean;

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000' // Development URL
  : 'https://api.finmatter.com'; // Production URL

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async config => {
        try {
          const session = await storageService.get<{
            session: { token: string };
          }>('user_session');

          if (session?.session?.token) {
            config.headers.Authorization = `Bearer ${session.session.token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Handle unauthorized - token might be expired
          this.handleUnauthorized();
        }

        return Promise.reject(error);
      },
    );
  }

  private async handleUnauthorized() {
    try {
      // Clear stored session
      await storageService.delete('user_session');

      // You could emit an event here to trigger logout in the app
      // or navigate to login screen
      console.log('User session expired, redirecting to login');
    } catch (error) {
      console.error('Error handling unauthorized:', error);
    }
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Method to update base URL (useful for development/staging/production)
  setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  // Method to get current base URL
  getBaseURL() {
    return this.client.defaults.baseURL;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
