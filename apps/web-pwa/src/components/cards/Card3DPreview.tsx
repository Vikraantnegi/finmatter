'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { CardDetectionResult } from '@/services/cardDetectionService';

interface Card3DProps {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  network: CardDetectionResult['network'];
  bankName?: string;
  isFlipped?: boolean;
}

function Card3D({
  cardNumber,
  cardholderName,
  expiryDate,
  network,
  bankName,
  isFlipped = false,
}: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Auto-rotate slightly for visual interest
  useFrame(state => {
    if (groupRef.current && !isFlipped) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      groupRef.current.rotation.x =
        Math.cos(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  // Card gradient colors based on bank/network
  const cardColors = useMemo(() => {
    const colors: Record<string, [string, string]> = {
      'HDFC Bank': ['#004C8F', '#0066CC'],
      'ICICI Bank': ['#B02A30', '#F26522'],
      'Axis Bank': ['#800000', '#A4243B'],
      'State Bank of India': ['#22409A', '#1E88E5'],
      'Kotak Mahindra Bank': ['#ED1C24', '#D50032'],
      'IndusInd Bank': ['#D40E3D', '#FF385C'],
      HSBC: ['#DB0011', '#EE3124'],
      'American Express': ['#006FCF', '#0077C8'],
      default: ['#1E293B', '#334155'],
    };

    return colors[bankName || 'default'] || colors.default;
  }, [bankName]);

  // Format card number with masking
  const displayNumber = useMemo(() => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const formatted = cardNumber.replace(/\s/g, '');
    const masked =
      formatted.slice(0, -4).replace(/\d/g, '•') + formatted.slice(-4);
    return masked.match(/.{1,4}/g)?.join(' ') || masked;
  }, [cardNumber]);

  return (
    <group ref={groupRef} rotation={isFlipped ? [0, Math.PI, 0] : [0, 0, 0]}>
      {/* Card Body */}
      <RoundedBox args={[3.375, 2.125, 0.1]} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color={new THREE.Color(cardColors[0])}
          metalness={0.6}
          roughness={0.4}
        />
      </RoundedBox>

      {/* Gradient Overlay */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[3.375, 2.125]} />
        <meshBasicMaterial
          transparent
          opacity={0.3}
          color={new THREE.Color(cardColors[1])}
        />
      </mesh>

      {!isFlipped ? (
        // Front Side
        <>
          {/* Chip */}
          <RoundedBox
            args={[0.4, 0.3, 0.05]}
            radius={0.02}
            position={[-0.9, 0.4, 0.06]}
          >
            <meshStandardMaterial
              color='#FFD700'
              metalness={0.9}
              roughness={0.1}
            />
          </RoundedBox>

          {/* Card Number */}
          <Text
            position={[0, 0.1, 0.06]}
            fontSize={0.2}
            color='#FFFFFF'
            anchorX='center'
            font='/fonts/CreditCard.woff'
          >
            {displayNumber}
          </Text>

          {/* Cardholder Name */}
          <Text
            position={[-0.9, -0.5, 0.06]}
            fontSize={0.12}
            color='#E0E0E0'
            anchorX='left'
            font='/fonts/CreditCard.woff'
          >
            {cardholderName.toUpperCase() || 'YOUR NAME'}
          </Text>

          {/* Expiry */}
          <Text
            position={[0.6, -0.5, 0.06]}
            fontSize={0.1}
            color='#E0E0E0'
            anchorX='left'
          >
            {`VALID\nTHRU ${expiryDate || 'MM/YY'}`}
          </Text>

          {/* Network Logo (Placeholder) */}
          <Text
            position={[1.2, -0.7, 0.06]}
            fontSize={0.15}
            color='#FFFFFF'
            anchorX='center'
            fontWeight='bold'
          >
            {network !== 'Unknown' ? network.toUpperCase() : ''}
          </Text>

          {/* Bank Name */}
          {bankName && (
            <Text
              position={[0, 0.8, 0.06]}
              fontSize={0.14}
              color='#FFFFFF'
              anchorX='center'
              fontWeight='600'
            >
              {bankName.toUpperCase()}
            </Text>
          )}
        </>
      ) : (
        // Back Side
        <>
          {/* Magnetic Stripe */}
          <mesh position={[0, 0.6, 0.06]}>
            <planeGeometry args={[3.375, 0.4]} />
            <meshStandardMaterial color='#000000' />
          </mesh>

          {/* Signature Strip */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[2.8, 0.3]} />
            <meshStandardMaterial color='#FFFFFF' />
          </mesh>

          {/* CVV */}
          <Text
            position={[1, 0, 0.07]}
            fontSize={0.12}
            color='#000000'
            anchorX='center'
          >
            CVV
          </Text>
        </>
      )}
    </group>
  );
}

export function Card3DPreview({
  cardNumber = '',
  cardholderName = '',
  expiryDate = '',
  network = 'Unknown',
  bankName,
  isFlipped = false,
  className = '',
}: Card3DProps & { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative w-full h-64 ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <spotLight
          position={[-5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
        />

        <Card3D
          cardNumber={cardNumber}
          cardholderName={cardholderName}
          expiryDate={expiryDate}
          network={network}
          bankName={bankName}
          isFlipped={isFlipped}
        />
      </Canvas>
    </motion.div>
  );
}
