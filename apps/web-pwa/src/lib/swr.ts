/**
 * SWR Configuration for FinMatter
 * Global configuration for SWR data fetching library
 */

import { SWRConfiguration } from 'swr';
import { apiClient } from './apiClient';

/**
 * Default SWR fetcher using apiClient
 * Automatically handles authentication and error handling
 */
export const defaultFetcher = async <T,>(url: string): Promise<T> => {
  const response = await apiClient.get<T>(url);
  return response as T;
};

/**
 * Global SWR configuration
 * Applied to all useSWR calls unless overridden
 */
export const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher,

  // Revalidation
  revalidateOnFocus: true, // Refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when coming back online
  revalidateOnMount: true, // Refetch on component mount
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000, // Wait 5s between retries
  
  // Deduplication
  dedupingInterval: 2000, // Dedupe requests within 2s
  
  // Performance
  focusThrottleInterval: 5000, // Throttle focus revalidation to 5s
  loadingTimeout: 3000, // Show slow connection warning after 3s
  
  // Callbacks
  onError: (error, key) => {
    console.error(`[SWR Error] ${key}:`, error);
    // TODO: Send to error tracking service (Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { tags: { swrKey: key } });
    // }
  },
  
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404
    if (error.status === 404) return;
    
    // Don't retry on 401/403 (auth errors)
    if (error.status === 401 || error.status === 403) return;
    
    // Only retry up to 3 times
    if (retryCount >= 3) return;
    
    // Exponential backoff
    setTimeout(() => revalidate({ retryCount }), 1000 * Math.pow(2, retryCount));
  },
};

/**
 * SWR configuration for real-time data (more aggressive revalidation)
 */
export const realtimeSwrConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Auto-refresh every 30s
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

/**
 * SWR configuration for static/slow-changing data (less aggressive)
 */
export const staticSwrConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
};

