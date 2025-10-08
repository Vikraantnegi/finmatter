'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/login');
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center gradient-bg'>
      <div className='text-center flex flex-col items-center justify-center'>
        <LoadingSpinner size='lg' className='mb-4 mx-auto' />
        <div className='text-white text-xl font-medium'>
          Redirecting to FinMatter...
        </div>
      </div>
    </div>
  );
}
