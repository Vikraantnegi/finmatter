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
