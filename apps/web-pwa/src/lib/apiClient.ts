import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(
            '✅ Added Authorization header:',
            `Bearer ${token.substring(0, 20)}...`,
          );
        } else {
          console.log('❌ No token available, skipping Authorization header');
        }

        console.log(
          `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        console.log('📋 Request headers:', config.headers);
        return config;
      },
      error => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        return response;
      },
      error => {
        console.error(
          '❌ Response Error:',
          error.response?.data || error.message,
        );

        // Handle common errors with better messages
        if (error.response?.status === 401) {
          const errorMessage =
            error.response?.data?.error?.message ||
            'Session expired. Please login again.';
          toast.error(errorMessage);
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 1000);
        } else if (error.response?.status === 403) {
          const errorMessage =
            error.response?.data?.error?.message ||
            'Access denied. Insufficient permissions.';
          toast.error(errorMessage);
        } else if (error.response?.status === 422) {
          // Validation errors - show specific message from server
          const errorMessage =
            error.response?.data?.error?.message ||
            'Invalid input. Please check your details.';
          toast.error(errorMessage);
        } else if (error.response?.status === 429) {
          // Rate limiting
          const errorMessage =
            error.response?.data?.error?.message ||
            'Too many requests. Please wait a moment.';
          toast.error(errorMessage);
        } else if (error.response?.status >= 500) {
          const errorMessage =
            error.response?.data?.error?.message ||
            'Server error. Please try again later.';
          toast.error(errorMessage);
        } else if (
          error.code === 'NETWORK_ERROR' ||
          error.message === 'Network Error'
        ) {
          toast.error('Network error. Please check your connection.');
        } else if (error.response?.data?.error?.message) {
          // Show specific error message from server
          toast.error(error.response.data.error.message);
        } else {
          // Fallback error message
          toast.error('Something went wrong. Please try again.');
        }

        return Promise.reject(error);
      },
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Get token from auth store
    try {
      const authData = localStorage.getItem('auth-storage');
      console.log('🔍 Auth storage data:', authData);
      if (authData) {
        const parsed = JSON.parse(authData);
        // The token is nested at parsed.state.state.sessionToken (double state nesting)
        const token =
          parsed.state?.state?.sessionToken ||
          parsed.state?.sessionToken ||
          null;
        console.log(
          '🔑 Extracted token:',
          token ? `${token.substring(0, 20)}...` : 'null',
        );
        return token;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    console.log('❌ No auth token found');
    return null;
  }

  public setAuthToken(_token: string) {
    // This method is kept for backward compatibility
    // Session management is now handled by Zustand store
  }

  public clearAuthToken() {
    // Clear auth storage
    localStorage.removeItem('auth-storage');
  }

  // Generic HTTP methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
