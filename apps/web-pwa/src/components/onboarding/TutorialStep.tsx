'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface TutorialStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function TutorialStep({ onNext, onSkip }: TutorialStepProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [swiperRef, setSwiperRef] = useState<any>(null);

  const slides = [
    {
      icon: '💳',
      title: 'Add Your Cards',
      description:
        'Start by adding your credit cards. We support all major Indian banks.',
      features: [
        'HDFC, ICICI, SBI, Axis',
        'Secure and encrypted storage',
        'Auto-detect card benefits',
        'Track spending and limits',
      ],
    },
    {
      icon: '🎯',
      title: 'Get Smart Recommendations',
      description:
        'Our AI analyzes your spending and recommends the best card for each purchase.',
      features: [
        'Real-time recommendations',
        'Maximize rewards',
        'Save money on fees',
      ],
    },
    // TODO: Uncomment when features are ready
    // {
    //   icon: '📊',
    //   title: 'Upload Statements',
    //   description:
    //     'Upload your bank statements to automatically track transactions and categorize spending.',
    //   features: [
    //     'PDF statement parsing',
    //     'Automatic categorization',
    //     'Spending insights',
    //   ],
    // },
    // {
    //   icon: '📈',
    //   title: 'Track Your Progress',
    //   description:
    //     'Monitor your spending patterns, rewards earned, and optimize your credit card usage.',
    //   features: ['Spending analytics', 'Reward tracking', 'Goal setting'],
    // },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      if (swiperRef) {
        swiperRef.slideNext();
      }
    } else {
      onNext();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      if (swiperRef) {
        swiperRef.slidePrev();
      }
    }
  };

  const handleSlideChange = (swiper: any) => {
    setCurrentSlide(swiper.activeIndex);
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Welcome to FinMatter
          </h1>
          <p className='text-gray-600'>
            Let&apos;s walk through how to make the most of your credit cards
          </p>
        </div>

        {/* Swiper */}
        <div className='relative'>
          <Swiper
            onSwiper={setSwiperRef}
            onSlideChange={handleSlideChange}
            modules={[Navigation, Pagination]}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active',
            }}
            spaceBetween={30}
            slidesPerView={1}
            className='tutorial-swiper h-80'
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className='text-center space-y-6 h-full flex flex-col justify-center'>
                  <div className='flex justify-center'>
                    <div className='w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center'>
                      <span className='text-white text-3xl'>{slide.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900 mb-2'>
                      {slide.title}
                    </h2>
                    <p className='text-gray-600 mb-4'>{slide.description}</p>
                  </div>
                  <div className='space-y-3'>
                    {slide.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className='flex items-center justify-center space-x-3'
                      >
                        <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
                        <span className='text-gray-600 text-sm'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Navigation */}
        <div className='flex justify-between items-center'>
          <Button
            onClick={prevSlide}
            variant='outline'
            size='sm'
            disabled={currentSlide === 0}
          >
            Previous
          </Button>

          <Button onClick={nextSlide} size='sm'>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>

        {/* Skip Button */}
        <div className='text-center'>
          <button
            onClick={onSkip}
            className='text-sm text-gray-500 hover:text-gray-700 underline'
          >
            Skip Tutorial
          </button>
        </div>
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .tutorial-swiper .swiper-pagination {
          position: relative;
          margin-top: 1rem;
        }

        .tutorial-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #d1d5db;
          opacity: 1;
          margin: 0 4px;
        }

        .tutorial-swiper .swiper-pagination-bullet-active {
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
}
