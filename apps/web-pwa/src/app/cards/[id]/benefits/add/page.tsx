'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const BENEFIT_CATEGORIES = [
  'dining',
  'travel',
  'shopping',
  'entertainment',
  'fuel',
  'groceries',
  'utilities',
  'insurance',
  'lounge_access',
  'other',
];

export default function AddBenefitPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    value: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Benefit added successfully');
      router.push(`/cards/${cardId}`);
    } catch (error) {
      // Error handled by toast
      toast.error('Failed to add benefit');
      setErrors({ submit: 'Failed to add benefit. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-30'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center py-4'>
            <button
              onClick={() => router.back()}
              className='mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5 text-gray-600' />
            </button>
            <h1 className='text-xl font-bold text-gray-900'>Add Benefit</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Category *
            </label>
            <select
              value={formData.category}
              onChange={e => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value=''>Select a category</option>
              {BENEFIT_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className='text-red-500 text-sm mt-1'>{errors.category}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='e.g., 5% cashback on dining transactions'
            />
            {errors.description && (
              <p className='text-red-500 text-sm mt-1'>{errors.description}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Value (Optional)
            </label>
            <input
              type='text'
              value={formData.value}
              onChange={e => handleInputChange('value', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              placeholder='e.g., 5% or ₹500'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Enter the reward value or percentage
            </p>
          </div>

          {errors.submit && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>{errors.submit}</p>
            </div>
          )}

          <div className='flex space-x-3 pt-4'>
            <Button
              variant='outline'
              onClick={() => router.back()}
              className='flex-1'
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className='flex-1 flex items-center justify-center space-x-2'
            >
              {saving ? (
                <LoadingSpinner size='sm' />
              ) : (
                <>
                  <Plus className='w-4 h-4' />
                  <span>Add Benefit</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
