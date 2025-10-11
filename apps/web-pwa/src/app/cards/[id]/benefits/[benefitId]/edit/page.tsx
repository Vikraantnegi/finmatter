'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useCardStore } from '@/stores/cardStore';
import { CardBenefit } from '@finmatter/types';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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

export default function EditBenefitPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;
  const benefitId = params.benefitId as string;

  const { cards } = useCardStore();
  const [benefit, setBenefit] = useState<CardBenefit | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    value: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Find benefit
  useEffect(() => {
    const card = cards.find(c => c.id === cardId);
    if (card && card.benefits) {
      const foundBenefit = card.benefits.find(b => b.id === benefitId);
      if (foundBenefit) {
        setBenefit(foundBenefit);
        setFormData({
          category: foundBenefit.category,
          description: foundBenefit.description,
          value: foundBenefit.value || '',
        });
      }
    }
  }, [cardId, benefitId, cards]);

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

      toast.success('Benefit updated successfully');
      router.push(`/cards/${cardId}`);
    } catch (error) {
      // Error handled by toast
      toast.error('Failed to update benefit');
      setErrors({ submit: 'Failed to update benefit. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Benefit deleted successfully');
      router.push(`/cards/${cardId}`);
    } catch (error) {
      // Error handled by toast
      toast.error('Failed to delete benefit');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!benefit) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-30'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-4'>
            <div className='flex items-center'>
              <button
                onClick={() => router.back()}
                className='mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <ArrowLeft className='w-5 h-5 text-gray-600' />
              </button>
              <h1 className='text-xl font-bold text-gray-900'>Edit Benefit</h1>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowDeleteModal(true)}
              className='flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50'
            >
              <Trash2 className='w-4 h-4' />
              <span>Delete</span>
            </Button>
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
                  <Save className='w-4 h-4' />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title='Delete Benefit'
      >
        <div className='space-y-4'>
          <p className='text-gray-600'>
            Are you sure you want to delete this benefit? This action cannot be
            undone.
          </p>
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={() => setShowDeleteModal(false)}
              className='flex-1'
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className='flex-1 bg-red-600 hover:bg-red-700'
            >
              {deleting ? <LoadingSpinner size='sm' /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
