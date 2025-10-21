'use client';

import { useState, useEffect, useCallback } from 'react';
import { statementService } from '@/services/statementService';

interface UseStatementStatusOptions {
  statementId: string | null;
  enabled?: boolean;
  interval?: number; // Polling interval in milliseconds
}

export function useStatementStatus({
  statementId,
  enabled = true,
  interval = 3000, // 3 seconds
}: UseStatementStatusOptions) {
  const [status, setStatus] = useState<
    'pending' | 'processing' | 'success' | 'failed'
  >('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!statementId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await statementService.getStatementById(statementId);

      if (response.success && response.data) {
        const newStatus = response.data.statement.status;
        setStatus(newStatus);
        setStatement(response.data.statement);

        // Stop polling if status is final
        if (newStatus === 'success' || newStatus === 'failed') {
          return false; // Stop polling
        }
      } else {
        setError('Failed to fetch statement status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }

    return true; // Continue polling
  }, [statementId, enabled]);

  useEffect(() => {
    if (!statementId || !enabled) return;

    setIsPolling(true);

    // Initial check
    checkStatus();

    // Set up polling
    const pollInterval = setInterval(async () => {
      const shouldContinue = await checkStatus();
      if (!shouldContinue) {
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, interval);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [statementId, enabled, interval, checkStatus]);

  return {
    status,
    isLoading,
    error,
    statement,
    isPolling,
    refetch: checkStatus,
  };
}
