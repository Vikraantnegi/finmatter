'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CardVisual } from '@/components/cards/CardVisual';
import { FilterModal } from '@/components/cards/FilterModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCardStore } from '@/stores/cardStore';
// import { Card } from '@finmatter/types';
import { Plus, Filter, Search } from 'lucide-react';

type SortBy = 'name' | 'limit' | 'utilization';

export default function CardsPage() {
  const router = useRouter();
  const { cards, isLoading: loading, fetchCards } = useCardStore();

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch cards on mount
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Filter and sort cards
  const filteredCards = cards
    .filter(card => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          card.cardName.toLowerCase().includes(query) ||
          card.bankName?.toLowerCase().includes(query) ||
          card.lastFourDigits?.includes(query)
        );
      }

      // Category filter
      if (selectedCategory) {
        return card.benefits?.some(
          benefit => benefit.category === selectedCategory,
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.cardName.localeCompare(b.cardName);
        case 'limit':
          return (b.creditLimit || 0) - (a.creditLimit || 0);
        case 'utilization': {
          const aUtil =
            a.creditLimit && a.availableCredit
              ? ((a.creditLimit - a.availableCredit) / a.creditLimit) * 100
              : 0;
          const bUtil =
            b.creditLimit && b.availableCredit
              ? ((b.creditLimit - b.availableCredit) / b.creditLimit) * 100
              : 0;
          return bUtil - aUtil;
        }
        default:
          return 0;
      }
    });

  // Get unique categories from all cards
  const categories = Array.from(
    new Set(
      cards.flatMap(
        card => card.benefits?.map(benefit => benefit.category) || [],
      ),
    ),
  );

  // Calculate portfolio stats
  const totalLimit = cards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0,
  );
  const totalUsed = cards.reduce((sum, card) => {
    const limit = card.creditLimit || 0;
    const used = limit - (card.availableCredit || 0);
    return sum + used;
  }, 0);
  const avgUtilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const handleCardClick = (cardId: string) => {
    router.push(`/cards/${cardId}`);
  };

  const handleAddCard = () => {
    router.push('/cards/add');
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>My Cards</h1>
              <p className='text-gray-600 mt-1'>
                {cards.length} card{cards.length !== 1 ? 's' : ''} in your
                portfolio
              </p>
            </div>
            <Button
              onClick={handleAddCard}
              className='flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span>Add Card</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
      {cards.length > 0 && (
        <div className='bg-white border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  ₹{totalLimit.toLocaleString()}
                </div>
                <div className='text-sm text-gray-600'>Total Limit</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  ₹{totalUsed.toLocaleString()}
                </div>
                <div className='text-sm text-gray-600'>Total Used</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  ₹{(totalLimit - totalUsed).toLocaleString()}
                </div>
                <div className='text-sm text-gray-600'>Available</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  {avgUtilization.toFixed(1)}%
                </div>
                <div className='text-sm text-gray-600'>Avg Utilization</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex space-x-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Search cards...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              />
            </div>
            <Button
              variant='outline'
              onClick={() => setShowFilterModal(true)}
              className='flex items-center space-x-2'
            >
              <Filter className='w-4 h-4' />
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {filteredCards.length === 0 ? (
          <EmptyState
            title='No cards found'
            description={
              searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Add your first credit card to get started'
            }
            action={
              !searchQuery && !selectedCategory
                ? {
                    label: 'Add Card',
                    onClick: handleAddCard,
                  }
                : undefined
            }
          />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredCards.map(card => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className='cursor-pointer transform transition-transform hover:scale-105'
              >
                <CardVisual card={card} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  );
}
