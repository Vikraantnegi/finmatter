'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { TUTORIAL_SLIDES, TUTORIAL_CTA } from '@finmatter/shared/src/constants';
import { Header } from '@/components/layout/Header';

import 'swiper/css';

type TutorialSlide = (typeof TUTORIAL_SLIDES)[number];

export function TutorialScreen() {
  const router = useRouter();
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleGetStarted = () => {
    router.push('/auth/login?mode=signup');
  };

  const handleSignIn = () => {
    router.push('/auth/login?mode=login');
  };

  return (
    <div className='min-h-screen bg-background-dark flex flex-col'>
      <Header />

      <main className='flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto px-4 pb-8'>
        <div className='flex flex-col h-[60vh]'>
          <div className='flex-1 flex justify-center'>
            <Swiper
              onSwiper={setSwiper}
              onSlideChange={swiper => {
                setCurrentSlide(swiper.realIndex);
              }}
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={true}
              className='flex-1 w-full h-full'
            >
              {TUTORIAL_SLIDES.map((slide: TutorialSlide, index: number) => (
                <SwiperSlide key={index}>
                  <div className='flex flex-1 flex-col items-center justify-center h-full gap-6 px-4'>
                    <div className='flex-1 relative flex w-full justify-center px-4 py-3'>
                      <div className='flex-1 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800'>
                        <span
                          className='material-symbols-outlined text-primary text-8xl'
                          style={{
                            fontSize: 'clamp(6rem, 15vw, 10rem)',
                            lineHeight: '1',
                            display: 'inline-block',
                          }}
                        >
                          {slide.icon}
                        </span>
                      </div>
                    </div>

                    <h1 className='text-gray-900 dark:text-white tracking-tight text-2xl font-extrabold leading-tight text-center w-3/4'>
                      {slide.title}
                    </h1>

                    <p className='-mt-1 max-w-sm text-center text-base font-normal leading-normal text-gray-600 dark:text-gray-300'>
                      {slide.subtitle}
                    </p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className='flex items-center justify-center gap-2 py-4'>
            {TUTORIAL_SLIDES.map((_: TutorialSlide, index: number) => (
              <button
                key={index}
                onClick={() => {
                  if (swiper) {
                    swiper.slideToLoop(index);
                  }
                }}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-primary'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className='flex w-full flex-col items-stretch gap-3 px-4 py-3'>
          <button
            onClick={handleGetStarted}
            className='flex h-12 min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary px-5 text-base font-bold leading-normal tracking-[0.015em] text-white transition-opacity hover:opacity-90'
          >
            <span className='truncate'>{TUTORIAL_CTA.getStarted}</span>
          </button>
          <button
            onClick={handleSignIn}
            className='flex h-12 min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary/10 dark:bg-[#233c48] px-5 text-base font-bold leading-normal tracking-[0.015em] text-primary dark:text-white transition-colors hover:bg-primary/20 dark:hover:bg-primary/30'
          >
            <span className='truncate'>{TUTORIAL_CTA.signIn}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
