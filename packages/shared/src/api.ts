/**
 * API utilities for FinMatter
 */

import { retryWithBackoff } from './errors';
import { API_CONFIG } from './constants';

/**
 * HTTP request options
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

/**
 * HTTP response
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
}

/**
 * API client class
 */
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(
    baseURL: string = API_CONFIG.baseUrl,
    defaultHeaders: Record<string, string> = {},
    timeout: number = API_CONFIG.timeout
  ) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
    this.timeout = timeout;
  }

  /**
   * Set default headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string): void {
    this.setHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Remove authorization token
   */
  removeAuthToken(): void {
    const { Authorization, ...headers } = this.defaultHeaders;
    this.defaultHeaders = headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      signal
    } = options;

    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: signal || null
    };

    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Remove Content-Type header for FormData (browser will set it with boundary)
        if (requestOptions.headers && 'Content-Type' in requestOptions.headers) {
          delete (requestOptions.headers as any)['Content-Type'];
        }
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Use provided signal or timeout signal
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: signal || controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: T;

      // Parse response body
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as T;
      }

      if (!response.ok) {
        throw new Error(
          data && typeof data === 'object' && 'message' in data
            ? (data as any).message
            : `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        config: options
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Network request failed');
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    endpoint: string,
    file: File,
    additionalData: Record<string, any> = {},
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional form data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData
    });
  }

  /**
   * Download file
   */
  async download(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<Blob> {
    const response = await this.request(endpoint, { ...options, method: 'GET' });
    return new Blob([response.data as any]);
  }
}

/**
 * Create API client instance
 */
export const createApiClient = (
  baseURL?: string,
  defaultHeaders?: Record<string, string>,
  timeout?: number
): ApiClient => {
  return new ApiClient(baseURL, defaultHeaders, timeout);
}

/**
 * Default API client
 */
export const apiClient = createApiClient();

/**
 * Request with retry logic
 */
export const requestWithRetry = async <T = any>(
  requestFn: () => Promise<ApiResponse<T>>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
  } = {}
): Promise<ApiResponse<T>> => {
  return retryWithBackoff(requestFn, options);
}

/**
 * Create query string from object
 */
export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

/**
 * Build URL with query parameters
 */
export const buildURL = (baseURL: string, params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseURL;
  }

  const queryString = createQueryString(params);
  const separator = baseURL.includes('?') ? '&' : '?';

  return `${baseURL}${separator}${queryString}`;
}

/**
 * Parse error response
 */
export const parseErrorResponse = async (response: Response): Promise<{
  message: string;
  code?: string;
  details?: Record<string, any>;
}> => {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        message: data.message || data.error || 'Request failed',
        code: data.code || data.errorCode,
        details: data.details || data.errors
      };
    } else {
      const text = await response.text();
      return {
        message: text || `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch {
    return {
      message: `HTTP ${response.status}: ${response.statusText}`
    };
  }
}

/**
 * Check if response is successful
 */
export const isSuccessfulResponse = (status: number): boolean => {
  return status >= 200 && status < 300;
}

/**
 * Check if response is client error
 */
export const isClientError = (status: number): boolean => {
  return status >= 400 && status < 500;
}

/**
 * Check if response is server error
 */
export const isServerError = (status: number): boolean => {
  return status >= 500 && status < 600;
}

/**
 * Get status text for common status codes
 */
export const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };

  return statusTexts[status] || 'Unknown Status';
}

/**
 * Create request interceptor
 */
export const createRequestInterceptor = (
  interceptor: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>
) => {
  return interceptor;
}

/**
 * Create response interceptor
 */
export const createResponseInterceptor = (
  interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
) => {
  return interceptor;
}

/**
 * Batch requests
 */
export const batchRequests = async <T = any>(
  requests: Array<() => Promise<ApiResponse<T>>>
): Promise<ApiResponse<T>[]> => {
  return Promise.all(requests.map(request => request()));
}

/**
 * Sequential requests
 */
export const sequentialRequests = async <T = any>(
  requests: Array<() => Promise<ApiResponse<T>>>
): Promise<ApiResponse<T>[]> => {
  const results: ApiResponse<T>[] = [];
  
  for (const request of requests) {
    const result = await request();
    results.push(result);
  }
  
  return results;
}

/**
 * Debounced request
 */
export const createDebouncedRequest = <T = any>(
  requestFn: () => Promise<ApiResponse<T>>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  let promise: Promise<ApiResponse<T>> | null = null;

  return () => {
    return new Promise<ApiResponse<T>>((resolve, reject) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          if (!promise) {
            promise = requestFn();
          }
          
          const result = await promise;
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          promise = null;
        }
      }, delay);
    });
  };
}
