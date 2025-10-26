'use client';

import React from 'react';
import { SWRConfig, SWRConfiguration } from 'swr';
import { apiClient } from '@/lib/apiClient';

/**
 * Default SWR fetcher using apiClient
 * Automatically handles authentication and error handling
 */
const defaultFetcher = async <T,>(url: string): Promise<T> => {
  const response = await apiClient.get<T>(url);
  return response as T;
};

/**
 * Global SWR configuration
 * Applied to all useSWR calls unless overridden
 */
const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher,

  // Revalidation
  revalidateOnFocus: true, // Refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when coming back online
  revalidateOnMount: true, // Refetch on component mount

  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 1, // Only retry once
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
    // Only retry once
    if (retryCount >= 1) return;

    // Only retry 401 errors (unauthorized) - this is for auth token refresh
    if (error.status !== 401) return;

    // Detect CORS errors - they don't have a status code or have a specific error message
    const corsError =
      !error.response &&
      (error.message?.includes('CORS') ||
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'NETWORK_ERROR');

    // Don't retry CORS errors
    if (corsError) return;

    // Exponential backoff
    setTimeout(
      () => revalidate({ retryCount }),
      1000 * Math.pow(2, retryCount),
    );
  },
};

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
