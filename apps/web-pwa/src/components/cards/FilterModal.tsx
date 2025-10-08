'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  sortBy: 'name' | 'limit' | 'utilization';
  onSortChange: (sortBy: 'name' | 'limit' | 'utilization') => void;
}

export function FilterModal({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategorySelect,
  sortBy,
  onSortChange,
}: FilterModalProps) {
  const handleApply = () => {
    onClose();
  };

  const handleReset = () => {
    onCategorySelect(null);
    onSortChange('name');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Filter Cards'>
      <div className='space-y-6'>
        {/* Categories Filter */}
        <div>
          <h4 className='text-sm font-medium text-gray-900 mb-3'>Categories</h4>
          <div className='space-y-2'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='category'
                checked={selectedCategory === null}
                onChange={() => onCategorySelect(null)}
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
              />
              <span className='ml-2 text-sm text-gray-700'>All Categories</span>
            </label>
            {categories.map(category => (
              <label
                key={category}
                className='flex items-center cursor-pointer'
              >
                <input
                  type='radio'
                  name='category'
                  checked={selectedCategory === category}
                  onChange={() => onCategorySelect(category)}
                  className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
                />
                <span className='ml-2 text-sm text-gray-700 capitalize'>
                  {category}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <h4 className='text-sm font-medium text-gray-900 mb-3'>Sort By</h4>
          <div className='space-y-2'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='sort'
                checked={sortBy === 'name'}
                onChange={() => onSortChange('name')}
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
              />
              <span className='ml-2 text-sm text-gray-700'>Card Name</span>
            </label>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='sort'
                checked={sortBy === 'limit'}
                onChange={() => onSortChange('limit')}
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
              />
              <span className='ml-2 text-sm text-gray-700'>Credit Limit</span>
            </label>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='sort'
                checked={sortBy === 'utilization'}
                onChange={() => onSortChange('utilization')}
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
              />
              <span className='ml-2 text-sm text-gray-700'>Utilization</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className='flex space-x-3 pt-4'>
          <Button variant='outline' onClick={handleReset} className='flex-1'>
            Reset
          </Button>
          <Button onClick={handleApply} className='flex-1'>
            Apply Filters
          </Button>
        </div>
      </div>
    </Modal>
  );
}
