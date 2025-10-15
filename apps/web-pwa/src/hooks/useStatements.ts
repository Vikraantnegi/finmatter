import useSWR from 'swr';
import { statementService } from '@/services/statementService';

export function useStatements(params?: {
  cardId?: string;
  status?: 'pending' | 'processing' | 'success' | 'failed';
}) {
  const { data, error, isLoading, mutate } = useSWR(
    params ? ['statements', params] : 'statements',
    () => statementService.getStatements(params),
  );

  return {
    statements: data?.data?.statements || [],
    pagination: data?.data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

export function useStatement(statementId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    statementId ? ['statement', statementId] : null,
    () => (statementId ? statementService.getStatementById(statementId) : null),
  );

  return {
    statement: data?.data?.statement,
    isLoading,
    error,
    mutate,
  };
}
