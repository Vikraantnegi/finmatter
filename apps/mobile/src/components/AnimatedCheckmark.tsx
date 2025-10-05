/**
 * Animated Checkmark Component
 * Shows success animation with checkmark
 */

import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface AnimatedCheckmarkProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  size?: number;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  isVisible,
  onAnimationComplete,
  size = 80,
}) => {
  const animationRef = useRef<Animatable.View & any>(null);

  useEffect(() => {
    if (isVisible && animationRef.current) {
      animationRef.current.bounceIn(800).then(() => {
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 500);
        }
      });
    }
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <View className='absolute inset-0 justify-center items-center bg-white/90 z-[1000]'>
      <Animatable.View
        ref={animationRef}
        className='bg-success rounded-full justify-center items-center shadow-lg'
        style={{ width: size, height: size }}
      >
        <Animatable.Text
          className='text-white font-bold'
          style={{ fontSize: size * 0.6 }}
          animation='pulse'
          iterationCount={1}
          duration={1000}
        >
          {'✓'}
        </Animatable.Text>
      </Animatable.View>
    </View>
  );
};

export default AnimatedCheckmark;
