/**
 * Category-wise Spending Bar Chart
 * Shows spending by category in a bar chart
 */

'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatLargeNumber, formatCurrency } from '@finmatter/shared';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface CategoryBarChartProps {
  data: CategoryData[];
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

const CustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y}
      fill='#666'
      textAnchor='middle'
      dominantBaseline='middle'
      fontSize={10}
    >
      {formatLargeNumber(value, 'INR')}
    </text>
  );
};

export function CategoryBarChart({
  data,
  className = '',
}: CategoryBarChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      category: item.category,
      amount: item.amount,
      count: item.count,
      percentage: item.percentage,
      color: COLORS[index % COLORS.length],
      // Short label for X-axis
      label:
        item.category.length > 10
          ? `${item.category.substring(0, 10)}...`
          : item.category,
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
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis
            dataKey='label'
            angle={-45}
            textAnchor='end'
            height={100}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <YAxis
            tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey='amount'
            radius={[8, 8, 0, 0]}
            label={<CustomBarLabel />}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
