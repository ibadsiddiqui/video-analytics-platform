'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip 
} from 'recharts';
import { Smile, Meh, Frown, MessageSquare } from 'lucide-react';

const COLORS = {
  positive: '#10b981',
  neutral: '#6366f1',
  negative: '#ef4444',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100">
        <p className="font-semibold text-slate-900 capitalize">{data.name}</p>
        <p className="text-sm" style={{ color: data.payload.fill }}>
          {data.value}%
        </p>
      </div>
    );
  }
  return null;
}

interface SentimentChartProps {
  sentiment: {
    overall: { score: number; sentiment: string };
    distribution: { positive: number; neutral: number; negative: number };
    totalAnalyzed: number;
  } | null;
}

function SentimentChart({ sentiment }: SentimentChartProps) {
  if (!sentiment || !sentiment.distribution) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-slate-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-slate-50">
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Sentiment Analysis</h3>
            <p className="text-sm text-slate-500">No comments available for analysis</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-slate-400">
          <p>Insufficient data for sentiment analysis</p>
        </div>
      </motion.div>
    );
  }

  const { distribution, overall, totalAnalyzed } = sentiment;

  const chartData = [
    { name: 'Positive', value: distribution.positive, color: COLORS.positive },
    { name: 'Neutral', value: distribution.neutral, color: COLORS.neutral },
    { name: 'Negative', value: distribution.negative, color: COLORS.negative },
  ];

  const getSentimentIcon = () => {
    if (overall.sentiment === 'POSITIVE') return <Smile className="w-5 h-5 text-emerald-500" />;
    if (overall.sentiment === 'NEGATIVE') return <Frown className="w-5 h-5 text-red-500" />;
    return <Meh className="w-5 h-5 text-primary-500" />;
  };

  const getSentimentLabel = () => {
    if (overall.sentiment === 'POSITIVE') return 'Positive';
    if (overall.sentiment === 'NEGATIVE') return 'Negative';
    return 'Neutral';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-slate-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50">
            <MessageSquare className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Sentiment Analysis</h3>
            <p className="text-sm text-slate-500">{totalAnalyzed} comments analyzed</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
          overall.sentiment === 'POSITIVE' ? 'bg-emerald-50' :
          overall.sentiment === 'NEGATIVE' ? 'bg-red-50' : 'bg-primary-50'
        }`}>
          {getSentimentIcon()}
          <span className={`text-sm font-medium ${
            overall.sentiment === 'POSITIVE' ? 'text-emerald-700' :
            overall.sentiment === 'NEGATIVE' ? 'text-red-700' : 'text-primary-700'
          }`}>
            {getSentimentLabel()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-center">
        <div className="w-1/2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-1/2 space-y-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-slate-700">{item.name}</span>
              </div>
              <span className="text-lg font-bold" style={{ color: item.color }}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default SentimentChart;
