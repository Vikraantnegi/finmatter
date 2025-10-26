/**
 * Category Icon Component
 * Displays appropriate icon for transaction categories
 */

'use client';

import React from 'react';
import { TransactionCategory } from '@finmatter/types';
import {
  Utensils,
  ShoppingBag,
  ShoppingCart,
  Fuel,
  Plane,
  Film,
  Receipt,
  Heart,
  GraduationCap,
  Bus,
  Zap,
  Shield,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

interface CategoryIconProps {
  category: TransactionCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const categoryIcons: Record<TransactionCategory, React.ComponentType<any>> = {
  dining: Utensils,
  shopping: ShoppingBag,
  groceries: ShoppingCart,
  fuel: Fuel,
  travel: Plane,
  entertainment: Film,
  bills: Receipt,
  healthcare: Heart,
  education: GraduationCap,
  transport: Bus,
  utilities: Zap,
  insurance: Shield,
  investment: TrendingUp,
  others: MoreHorizontal,
};

const categoryColors: Record<TransactionCategory, string> = {
  dining: 'bg-orange-100 text-orange-600',
  shopping: 'bg-purple-100 text-purple-600',
  groceries: 'bg-green-100 text-green-600',
  fuel: 'bg-yellow-100 text-yellow-600',
  travel: 'bg-blue-100 text-blue-600',
  entertainment: 'bg-pink-100 text-pink-600',
  bills: 'bg-gray-100 text-gray-600',
  healthcare: 'bg-red-100 text-red-600',
  education: 'bg-indigo-100 text-indigo-600',
  transport: 'bg-cyan-100 text-cyan-600',
  utilities: 'bg-yellow-100 text-yellow-600',
  insurance: 'bg-slate-100 text-slate-600',
  investment: 'bg-emerald-100 text-emerald-600',
  others: 'bg-gray-100 text-gray-600',
};

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export function CategoryIcon({
  category,
  size = 'md',
  className = '',
}: CategoryIconProps) {
  const IconComponent = categoryIcons[category];
  const colorClass = categoryColors[category];
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-center rounded-full ${colorClass} ${sizeClass} ${className}`}
    >
      <IconComponent
        className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`}
      />
    </div>
  );
}
