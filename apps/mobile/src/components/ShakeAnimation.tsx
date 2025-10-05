/**
 * Shake Animation Component
 * Provides shake animation for error states
 */

import React, { useEffect, useRef } from 'react';
import * as Animatable from 'react-native-animatable';

interface ShakeAnimationProps {
  children: React.ReactNode;
  shouldShake: boolean;
  onShakeComplete?: () => void;
}

export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
  children,
  shouldShake,
  onShakeComplete,
}) => {
  const animationRef = useRef<Animatable.View & any>(null);

  useEffect(() => {
    if (shouldShake && animationRef.current) {
      animationRef.current.shake(600).then(() => {
        if (onShakeComplete) {
          onShakeComplete();
        }
      });
    }
  }, [shouldShake, onShakeComplete]);

  return <Animatable.View ref={animationRef}>{children}</Animatable.View>;
};

export default ShakeAnimation;
