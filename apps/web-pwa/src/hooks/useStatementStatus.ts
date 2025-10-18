import { useState, useEffect, useRef, useCallback } from 'react';
import { statementService } from '@/services/statementService';

interface StatementStatus {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
  transactionCount?: number;
  parsedAt?: string;
  uploadedAt: string;
  fileName: string;
  fileSize: number;
}

interface UseStatementStatusOptions {
  statementId: string | null;
  enabled?: boolean;
  pollInterval?: number;
  maxPollingTime?: number;
}

interface UseStatementStatusReturn {
  status: StatementStatus | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
  refetch: () => void;
}

export function useStatementStatus({
  statementId,
  enabled = true,
  pollInterval = 5000, // 5 seconds
  maxPollingTime = 60000, // 1 minute
}: UseStatementStatusOptions): UseStatementStatusReturn {
  const [status, setStatus] = useState<StatementStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!statementId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await statementService.getStatementStatus(statementId);

      if (response.success && response.data?.statement) {
        const statementData = response.data.statement;
        setStatus(statementData);

        // Stop polling if status is final (success or failed)
        if (
          statementData.status === 'success' ||
          statementData.status === 'failed'
        ) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        setError(response.error?.message || 'Failed to fetch statement status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [statementId, enabled]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!statementId || !enabled || isPolling) return;

    setIsPolling(true);
    startTimeRef.current = Date.now();

    // Add a small delay before starting to poll to avoid immediate 404s
    setTimeout(() => {
      if (!mountedRef.current) return;

      // Initial fetch
      fetchStatus();

      // Set up polling interval
      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;

        // Check if we've exceeded max polling time
        if (
          startTimeRef.current &&
          Date.now() - startTimeRef.current > maxPollingTime
        ) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setError(
            'Statement processing is taking longer than expected. Please check back later.',
          );
          return;
        }

        fetchStatus();
      }, pollInterval);
    }, 1000); // 1 second delay
  }, [
    statementId,
    enabled,
    isPolling,
    pollInterval,
    maxPollingTime,
    fetchStatus,
  ]);

  const refetch = useCallback(() => {
    if (statementId && enabled) {
      fetchStatus();
    }
  }, [statementId, enabled, fetchStatus]);

  // Start/stop polling based on statementId and enabled state
  useEffect(() => {
    if (statementId && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [statementId, enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    isLoading,
    error,
    isPolling,
    refetch,
  };
}
