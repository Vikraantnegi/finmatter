/**
 * Animated Checkmark Component
 * Shows success animation with checkmark
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { theme } from '../constants/theme';

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
    <View style={styles.container}>
      <Animatable.View
        ref={animationRef}
        style={[styles.checkmarkContainer, { width: size, height: size }]}
      >
        <Animatable.Text
          style={[styles.checkmark, { fontSize: size * 0.6 }]}
          animation="pulse"
          iterationCount={1}
          duration={1000}
        >
          ✓
        </Animatable.Text>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  checkmarkContainer: {
    backgroundColor: theme.colors.success,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkmark: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});

export default AnimatedCheckmark;
