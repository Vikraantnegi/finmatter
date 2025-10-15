'use client';

import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatementCard } from '@/components/statements/StatementCard';
import { UploadStatementModal } from '@/components/statements/UploadStatementModal';
import { useStatements } from '@/hooks/useStatements';
import { useCards } from '@/hooks/useCards';
import { statementService } from '@/services/statementService';
import toast from 'react-hot-toast';

export default function StatementsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'success' | 'failed' | 'processing'
  >('all');

  const { statements, isLoading, mutate } = useStatements(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  );
  const { cards } = useCards();

  const handleUploadClick = () => {
    if (cards.length === 0) {
      toast.error('Please add a card first before uploading statements');
      return;
    }
    setSelectedCardId(cards[0]?.id || null);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    mutate();
  };

  const handleDelete = async (statementId: string) => {
    try {
      await statementService.deleteStatement(statementId);
      toast.success('Statement deleted successfully');
      mutate();
    } catch (error) {
      toast.error('Failed to delete statement');
    }
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Statements</h1>
              <p className='text-sm text-gray-600 mt-1'>
                Upload and manage your credit card statements
              </p>
            </div>
            <Button
              onClick={handleUploadClick}
              className='flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span>Upload Statement</span>
            </Button>
          </div>

          {/* Status Filter */}
          <div className='flex items-center space-x-2 mt-6'>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Successful
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'processing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {statements.length === 0 ? (
          <EmptyState
            icon={<FileText className='w-12 h-12 text-gray-400' />}
            title='No statements yet'
            description={
              statusFilter === 'all'
                ? 'Upload your credit card statement to get started with transaction tracking'
                : `No ${statusFilter} statements found`
            }
            action={{
              label: 'Upload Statement',
              onClick: handleUploadClick,
            }}
          />
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {statements.map(statement => (
              <StatementCard
                key={statement.id}
                statement={statement}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {selectedCardId && selectedCard && (
        <UploadStatementModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          cardId={selectedCardId}
          cardName={selectedCard.cardName}
          bankName={selectedCard.bankName}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
