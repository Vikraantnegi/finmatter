/**
 * Spending Distribution Pie Chart
 * Shows spending breakdown by category
 */

'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '@finmatter/shared';

interface SpendingData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface SpendingPieChartProps {
  data: SpendingData[];
  className?: string;
}

const COLORS = [
  '#8884d8', // purple
  '#82ca9d', // green
  '#ffc658', // orange
  '#ff7c7c', // red
  '#8dd1e1', // cyan
  '#d084d0', // pink
  '#ffb347', // peach
  '#87ceeb', // sky blue
  '#da70d6', // orchid
  '#b19cd9', // light purple
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className='bg-white p-3 rounded-lg shadow-lg border border-gray-200'>
        <p className='font-semibold text-gray-900 capitalize'>
          {data.category.replace(/_/g, ' ')}
        </p>
        <p className='text-sm text-gray-600'>
          Amount: {formatCurrency(data.amount, 'INR')}
        </p>
        <p className='text-sm text-gray-600'>
          Percentage: {data.percentage.toFixed(1)}%
        </p>
        <p className='text-sm text-gray-600'>Transactions: {data.count}</p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null; // Don't show label for small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill='white'
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline='central'
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function SpendingPieChart({
  data,
  className = '',
}: SpendingPieChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item.category.replace(/_/g, ' '),
      value: item.amount,
      ...item,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className='text-gray-500'>No spending data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width='100%' height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx='50%'
            cy='50%'
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill='#8884d8'
            dataKey='value'
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign='bottom'
            height={60}
            formatter={(value: string) =>
              value.charAt(0).toUpperCase() + value.slice(1)
            }
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
