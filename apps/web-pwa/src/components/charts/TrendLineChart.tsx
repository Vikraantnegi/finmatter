/**
 * Spending Trend Line Chart
 * Shows spending trends over time
 */

'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@finmatter/shared';

interface TrendData {
  date: string;
  amount: number;
  category?: string;
  count?: number;
}

interface TrendLineChartProps {
  data: TrendData[];
  className?: string;
  showComparison?: boolean;
  comparisonData?: TrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white p-3 rounded-lg shadow-lg border border-gray-200'>
        <p className='font-semibold text-gray-900 mb-2'>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className='text-sm' style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value, 'INR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendLineChart({
  data,
  className = '',
  showComparison = false,
  comparisonData,
}: TrendLineChartProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
      amount: item.amount,
      category: item.category,
      count: item.count,
    }));
  }, [data]);

  const combinedData = useMemo(() => {
    if (!showComparison || !comparisonData) return processedData;

    return processedData.map((item, index) => ({
      ...item,
      comparisonAmount: comparisonData[index]?.amount || 0,
    }));
  }, [processedData, comparisonData, showComparison]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className='text-gray-500'>No trend data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width='100%' height={300}>
        <LineChart
          data={combinedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='date' tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type='monotone'
            dataKey='amount'
            stroke='#8884d8'
            strokeWidth={2}
            dot={{ fill: '#8884d8', r: 4 }}
            activeDot={{ r: 6 }}
            name='Current Period'
          />
          {showComparison && (
            <Line
              type='monotone'
              dataKey='comparisonAmount'
              stroke='#82ca9d'
              strokeWidth={2}
              strokeDasharray='5 5'
              dot={{ fill: '#82ca9d', r: 4 }}
              activeDot={{ r: 6 }}
              name='Previous Period'
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
