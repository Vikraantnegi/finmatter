'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryActionsProps {
  onReset?: () => void;
}

/**
 * Separate component for error boundary actions
 * This allows us to use hooks (useRouter) in a functional component
 */
export function ErrorBoundaryActions({ onReset }: ErrorBoundaryActionsProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const handleRefresh = () => {
    if (onReset) {
      onReset();
    } else {
      router.refresh();
    }
  };

  return (
    <div className='flex gap-3'>
      <Button
        variant='outline'
        onClick={handleGoToDashboard}
        className='flex-1 flex items-center justify-center gap-2'
      >
        <Home className='w-4 h-4' />
        Dashboard
      </Button>
      <Button
        onClick={handleRefresh}
        className='flex-1 flex items-center justify-center gap-2'
      >
        <RefreshCw className='w-4 h-4' />
        Refresh
      </Button>
    </div>
  );
}
