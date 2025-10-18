'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Statement, statementService } from '@/services/statementService';
import { StatementDetails } from '@/components/statements/StatementDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StatementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const statementId = params.id as string;

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const response = await statementService.getStatementById(statementId);
      if (response.success && response.data?.statement) {
        setStatement(response.data.statement);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch statement');
      }
    } catch (error) {
      console.error('Failed to fetch statement:', error);
      toast.error('Failed to load statement details');
      router.push('/statements');
    } finally {
      setLoading(false);
    }
  }, [statementId, router]);

  useEffect(() => {
    if (statementId) {
      fetchStatement();
    }
  }, [statementId, fetchStatement]);

  const handleDelete = async () => {
    if (!statement) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this statement? This action cannot be undone.',
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await statementService.deleteStatement(statementId);
      toast.success('Statement deleted successfully');
      router.push('/statements');
    } catch (error) {
      console.error('Failed to delete statement:', error);
      toast.error('Failed to delete statement');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (statement?.filePath) {
      // In a real app, you'd implement file download
      toast('Download functionality coming soon');
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <p className='text-gray-500 mt-4'>Loading statement details...</p>
        </div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Statement Not Found
          </h1>
          <p className='text-gray-500 mb-6'>
            The statement you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button onClick={() => router.push('/statements')}>
            Back to Statements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push('/statements')}
                className='flex items-center space-x-2'
              >
                <ArrowLeft className='w-4 h-4' />
                <span>Back</span>
              </Button>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Statement Details
                </h1>
                <p className='text-gray-500'>
                  {statement.card?.bankName} • {statement.card?.cardName} • ****
                  {statement.card?.lastFourDigits}
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleDownload}
                className='flex items-center space-x-2'
              >
                <Download className='w-4 h-4' />
                <span>Download</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleDelete}
                disabled={deleting}
                className='flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <Trash2 className='w-4 h-4' />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <StatementDetails statement={statement} />
      </div>
    </div>
  );
}
