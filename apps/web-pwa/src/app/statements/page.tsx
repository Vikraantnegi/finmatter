'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Statement {
  id: string;
  file_name: string;
  file_size: number;
  bank_name: string;
  statement_period_start: string | null;
  statement_period_end: string | null;
  upload_date: string;
  transaction_count: number;
  parsing_status: 'pending' | 'processing' | 'success' | 'failed';
  parsing_error: string | null;
  cards?: {
    id: string;
    last_four_digits: string;
    card_name: string | null;
  };
}

export default function StatementsPage() {
  const router = useRouter();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStatements();
  }, []);

  // Auto-refresh if there are processing statements
  useEffect(() => {
    const hasProcessing = statements.some(
      s => s.parsing_status === 'processing',
    );
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchStatements();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [statements]);

  const fetchStatements = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: { statements: Statement[] };
      }>('/api/statements');

      if (response.success) {
        setStatements(response.data.statements);
      }
    } catch (error: any) {
      toast.error('Failed to load statements');
      console.error('Error fetching statements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (statementId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this statement? This will also delete all associated transactions.',
      )
    ) {
      return;
    }

    try {
      setDeletingId(statementId);
      await apiClient.delete(`/api/statements/${statementId}`);
      toast.success('Statement deleted successfully');
      fetchStatements();
    } catch (error: any) {
      toast.error('Failed to delete statement');
      console.error('Error deleting statement:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (statementId: string) => {
    try {
      setRetryingId(statementId);
      await apiClient.post(`/api/statements/${statementId}/retry`, {});
      toast.success('Retry initiated. Parsing in progress...');
      fetchStatements();
    } catch (error: any) {
      toast.error('Failed to retry parsing');
      console.error('Error retrying statement:', error);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusIcon = (status: Statement['parsing_status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className='w-5 h-5 text-green-400' />;
      case 'failed':
        return <XCircle className='w-5 h-5 text-red-400' />;
      case 'processing':
        return <Clock className='w-5 h-5 text-yellow-400 animate-spin' />;
      default:
        return <Clock className='w-5 h-5 text-gray-400' />;
    }
  };

  const getStatusText = (status: Statement['parsing_status']) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-6 border-b border-gray-800'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold text-white'>Statements</h1>
          <button
            onClick={() => router.push('/cards')}
            className='px-4 py-2 bg-primary hover:opacity-90 rounded-xl text-white font-medium flex items-center gap-2'
          >
            <Upload className='w-4 h-4' />
            Upload New
          </button>
        </div>
        <p className='text-sm text-gray-400'>
          {statements.length} statement{statements.length !== 1 ? 's' : ''}{' '}
          uploaded
        </p>
      </div>

      {/* Statements List */}
      {statements.length === 0 ? (
        <div className='flex-1 flex items-center justify-center px-6'>
          <EmptyState
            icon={<FileText className='w-12 h-12 text-gray-400' />}
            title='No statements yet'
            description='Upload your first credit card statement to get started'
            action={{
              label: 'Upload Statement',
              onClick: () => router.push('/cards'),
            }}
          />
        </div>
      ) : (
        <div className='flex-1 px-6 py-4 space-y-4'>
          {statements.map(statement => (
            <div
              key={statement.id}
              className='bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <FileText className='w-5 h-5 text-primary' />
                    <h3 className='text-lg font-semibold text-white'>
                      {statement.file_name}
                    </h3>
                  </div>

                  <div className='space-y-1 text-sm text-gray-400 ml-8'>
                    <div className='flex items-center gap-4'>
                      <span className='capitalize'>{statement.bank_name}</span>
                      {statement.cards && (
                        <span>
                          Card ending in {statement.cards.last_four_digits}
                        </span>
                      )}
                      <span>{formatFileSize(statement.file_size)}</span>
                    </div>

                    {statement.statement_period_start &&
                      statement.statement_period_end && (
                        <div>
                          Period:{' '}
                          {format(
                            new Date(statement.statement_period_start),
                            'MMM dd',
                          )}{' '}
                          -{' '}
                          {format(
                            new Date(statement.statement_period_end),
                            'MMM dd, yyyy',
                          )}
                        </div>
                      )}

                    <div>
                      Uploaded:{' '}
                      {format(new Date(statement.upload_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <div className='flex flex-col items-end gap-1'>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(statement.parsing_status)}
                      <span
                        className={`text-sm font-medium ${
                          statement.parsing_status === 'success'
                            ? 'text-green-400'
                            : statement.parsing_status === 'failed'
                              ? 'text-red-400'
                              : statement.parsing_status === 'processing'
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                        }`}
                      >
                        {getStatusText(statement.parsing_status)}
                      </span>
                    </div>
                    {statement.parsing_status === 'success' && (
                      <span className='text-xs text-gray-400'>
                        {statement.transaction_count} transactions
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(statement.id)}
                    disabled={deletingId === statement.id}
                    className='p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50'
                  >
                    {deletingId === statement.id ? (
                      <LoadingSpinner size='sm' />
                    ) : (
                      <Trash2 className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              {statement.parsing_status === 'failed' &&
                statement.parsing_error && (
                  <div className='mt-3 space-y-2'>
                    <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
                      <p className='text-xs text-red-400 font-medium mb-1'>
                        Parsing Failed
                      </p>
                      <p className='text-xs text-red-300'>
                        {statement.parsing_error}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRetry(statement.id)}
                      disabled={retryingId === statement.id}
                      className='w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-sm font-medium text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      {retryingId === statement.id ? (
                        <>
                          <LoadingSpinner size='sm' />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className='w-4 h-4' />
                          Try Again
                        </>
                      )}
                    </button>
                  </div>
                )}

              {statement.parsing_status === 'processing' && (
                <div className='mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-blue-400 animate-spin' />
                    <p className='text-xs text-blue-300'>
                      Parsing in progress... This may take a few minutes. Check
                      back later.
                    </p>
                  </div>
                </div>
              )}

              {statement.parsing_status === 'success' && (
                <button
                  onClick={() =>
                    router.push(`/statements/${statement.id}/transactions`)
                  }
                  className='mt-3 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-white transition-colors'
                >
                  View {statement.transaction_count} Transactions
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
