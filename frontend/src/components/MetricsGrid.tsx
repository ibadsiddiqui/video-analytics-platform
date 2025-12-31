'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';

const metricConfig = [
  {
    key: 'views',
    label: 'Total Views',
    icon: Eye,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    key: 'likes',
    label: 'Total Likes',
    icon: Heart,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-500',
  },
  {
    key: 'comments',
    label: 'Total Comments',
    icon: MessageCircle,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-500',
  },
  {
    key: 'engagementRate',
    label: 'Engagement Rate',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    isPercent: true,
  },
];

function MetricCard({ config, value, formattedValue, index }) {
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="metric-card group hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${config.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold text-slate-900">
          {formattedValue}
        </div>
        <div className="text-sm text-slate-500 font-medium">
          {config.label}
        </div>
      </div>

      {/* Subtle gradient decoration */}
      <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </motion.div>
  );
}

function MetricsGrid({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {metricConfig.map((config, index) => {
        const rawValue = metrics[config.key];
        const formattedValue = config.isPercent 
          ? `${rawValue?.toFixed(2) || 0}%`
          : metrics[`${config.key}Formatted`] || rawValue?.toLocaleString() || '0';

        return (
          <MetricCard
            key={config.key}
            config={config}
            value={rawValue}
            formattedValue={formattedValue}
            index={index}
          />
        );
      })}
    </div>
  );
}

export default MetricsGrid;
