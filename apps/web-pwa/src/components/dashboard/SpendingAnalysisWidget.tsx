'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MoreVertical } from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';
import { useTransactionsFromStore } from '@/hooks/useTransactionsStore';
import { calculateCategorySpending } from '@finmatter/shared';
import { SpendingAnalysisLoader } from './SectionLoader';

interface SpendingAnalysisWidgetProps {
  className?: string;
}

const COLORS = [
  '#13a4ec', // primary blue
  '#f97316', // orange
  '#a855f7', // purple
  '#ef4444', // red
  '#10b981', // green
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#eab308', // yellow
];

export function SpendingAnalysisWidget({
  className = '',
}: SpendingAnalysisWidgetProps) {
  const { transactions, isLoading } = useTransactionsFromStore();

  const categories = React.useMemo(() => {
    return calculateCategorySpending(transactions, 5);
  }, [transactions]);

  const totalSpend = React.useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [categories]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    return categories.map((cat, index) => ({
      name: cat.category,
      value: cat.amount,
      color: COLORS[index % COLORS.length],
    }));
  }, [categories]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className='bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg'>
          <p className='text-sm font-semibold text-white mb-1'>{data.name}</p>
          <p className='text-lg font-bold text-primary'>
            {formatCurrency(data.value)}
          </p>
          <p className='text-xs text-gray-400 mt-1'>
            {((data.value / totalSpend) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label function
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small segments

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
        className='text-xs font-medium'
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return <SpendingAnalysisLoader className={className} />;
  }

  if (categories.length === 0 || totalSpend === 0) {
    return (
      <div className={`px-6 ${className}`}>
        <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-white'>
              Spending Analysis
            </h3>
            <button className='text-gray-400 hover:text-white transition-colors'>
              <MoreVertical className='w-5 h-5' />
            </button>
          </div>
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4'>
              <span className='text-3xl text-gray-500'>📊</span>
            </div>
            <p className='text-base font-semibold text-white mb-2'>
              No spending data yet
            </p>
            <p className='text-sm text-gray-400 text-center max-w-xs'>
              Start spending to see your analysis here for this month.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-6 ${className}`}>
      <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>
            Spending Analysis
          </h3>
          <button className='text-gray-400 hover:text-white transition-colors'>
            <MoreVertical className='w-5 h-5' />
          </button>
        </div>

        {/* Chart */}
        <div className='mb-4'>
          <ResponsiveContainer width='100%' height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                innerRadius={40}
                fill='#8884d8'
                dataKey='value'
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Total Spent */}
        <div className='text-center mb-4'>
          <p className='text-xs text-gray-400 mb-1'>Total Spent</p>
          <p className='text-2xl font-bold text-white'>
            {formatCurrency(totalSpend)}
          </p>
        </div>

        {/* Legend */}
        <div className='space-y-2'>
          {categories.map((cat, index) => {
            return (
              <div
                key={cat.category}
                className='flex items-center justify-between text-sm'
              >
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  <div
                    className='w-3 h-3 rounded-full flex-shrink-0'
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <span className='text-gray-300 truncate'>{cat.category}</span>
                </div>
                <span className='text-white font-medium ml-2 flex-shrink-0'>
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
