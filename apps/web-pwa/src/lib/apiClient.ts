import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { authCookies } from './cookies';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;
  private _authToken: string | null = null;
  private _refreshToken: string | null = null;
  private _isRefreshing: boolean = false;
  private _failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies in all requests (for httpOnly refresh token)
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
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async error => {
        const originalRequest = error.config;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this._isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this._failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this._isRefreshing = true;

          try {
            const newToken = await this.refreshAuthToken();
            if (newToken) {
              this._authToken = newToken;

              // Process failed queue
              this._failedQueue.forEach(({ resolve }) => {
                resolve();
              });
              this._failedQueue = [];

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            // Process failed queue with error
            this._failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this._failedQueue = [];

            // Better UX for session expiration
            this.clearAuthToken();

            // Save current URL so user can return after re-login
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              const excludedPaths = ['/auth/login', '/auth/verify-otp', '/'];

              if (!excludedPaths.some(path => currentPath.startsWith(path))) {
                sessionStorage.setItem('finmatter-return-url', currentPath);
              }
            }

            // Show toast with more time to read
            toast.error('Your session has expired. Please login again.', {
              duration: 3000,
            });

            // Soft redirect with delay for better UX
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 1500);

            return Promise.reject(refreshError);
          } finally {
            this._isRefreshing = false;
          }
        } else if (error.response?.status === 403) {
          const errorMessage =
            error.response?.data?.error?.message ||
            'Access denied. Insufficient permissions.';
          toast.error(errorMessage);
        } else if (error.response?.status === 422) {
          // Validation errors - show specific message from server
          const rawError = error.response?.data?.error;
          const errorMessage =
            (typeof rawError === 'string' ? rawError : rawError?.message) ||
            error.response?.data?.message ||
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
        } else {
          const apiError =
            error.response?.data?.error ?? error.response?.data?.message;
          if (typeof apiError === 'string') {
            toast.error(apiError);
          } else if (typeof apiError?.message === 'string') {
            toast.error(apiError.message);
          } else {
            // Fallback error message
            toast.error('Something went wrong. Please try again.');
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private getAuthToken(): string | null {
    // First check internal token (fastest)
    if (this._authToken) {
      return this._authToken;
    }

    // Then check localStorage
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('finmatter-auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          const token = parsed.state?.sessionToken || null;
          if (token) {
            this._authToken = token; // Cache it
            return token;
          }
        }
      } catch (error) {
        // Silently fail
      }
    }

    // Finally check cookies
    const cookieToken = authCookies.getAccessToken();
    if (cookieToken) {
      this._authToken = cookieToken; // Cache it
      return cookieToken;
    }

    return null;
  }

  public setAuthToken(token: string, _refreshToken?: string) {
    // Store access token internally for immediate use
    this._authToken = token;
    // Don't store refresh token client-side - it's in httpOnly cookie
    this._refreshToken = null;

    // Store access token in cookie (refresh token set by server as httpOnly)
    if (typeof window !== 'undefined') {
      authCookies.setAccessToken(token);
    }
  }

  public clearAuthToken() {
    // Clear internal tokens, localStorage, and cookies
    this._authToken = null;
    this._refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finmatter-auth');
      authCookies.clearTokens();
    }
  }

  private async refreshAuthToken(): Promise<string | null> {
    // Refresh token is stored in httpOnly cookie - automatically sent with request
    // We don't need to get it from client-side storage (more secure)

    try {
      // Send empty body - refresh token comes from httpOnly cookie
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {}, // Empty body
        {
          withCredentials: true, // Include cookies in request
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.success && response.data.data?.session) {
        const newToken = response.data.data.session.token;
        // Note: newRefreshToken is set by server as httpOnly cookie

        // Update internal access token
        this._authToken = newToken;
        // Don't store refresh token client-side - it's in httpOnly cookie
        this._refreshToken = null;

        // Update cookies (access token only - refresh token set by server)
        if (typeof window !== 'undefined') {
          authCookies.setAccessToken(newToken);
        }

        return newToken;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
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
