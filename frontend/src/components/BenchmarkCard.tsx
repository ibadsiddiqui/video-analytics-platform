'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';
import type { VideoComparison } from '@/lib/services/benchmark';

interface BenchmarkCardProps {
  data: VideoComparison | null;
  isLoading?: boolean;
}

export default function BenchmarkCard({ data, isLoading = false }: BenchmarkCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center"
      >
        <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">Benchmark data not available</p>
        <p className="text-sm text-slate-400 mt-1">Video niche classification in progress</p>
      </motion.div>
    );
  }

  const {
    comparison,
    videoMetrics,
    benchmark,
    videoNiche,
  } = data;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'top_10':
        return 'bg-green-50 border-green-200';
      case 'top_25':
        return 'bg-blue-50 border-blue-200';
      case 'top_50':
        return 'bg-purple-50 border-purple-200';
      case 'average':
        return 'bg-yellow-50 border-yellow-200';
      case 'below_average':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getRankText = (rank: string) => {
    switch (rank) {
      case 'top_10':
        return { label: 'Top 10%', color: 'text-green-700' };
      case 'top_25':
        return { label: 'Top 25%', color: 'text-blue-700' };
      case 'top_50':
        return { label: 'Top 50%', color: 'text-purple-700' };
      case 'average':
        return { label: 'Average', color: 'text-yellow-700' };
      case 'below_average':
        return { label: 'Below Average', color: 'text-orange-700' };
      default:
        return { label: 'Unknown', color: 'text-slate-700' };
    }
  };

  const rankInfo = getRankText(comparison.rank);
  const viewsDiff = Math.round(comparison.viewsVsAverage);
  const engagementDiff = Math.round(comparison.engagementVsAverage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-6 ${getRankColor(comparison.rank)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">Niche Benchmark</h3>
          </div>
          <p className="text-sm text-slate-600">
            {videoNiche} • {benchmark.sampleSize} videos analyzed
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full font-semibold text-sm ${rankInfo.color}`}>
          {rankInfo.label}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Views Comparison */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Views Performance
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {comparison.viewsPercentile}%
            </span>
            <span className="text-xs text-slate-500">percentile</span>
          </div>
          <div className="flex items-center gap-1">
            {viewsDiff > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">+{viewsDiff}%</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                <span className="text-sm font-medium text-red-600">{viewsDiff}%</span>
              </>
            )}
            <span className="text-xs text-slate-500">vs average</span>
          </div>
        </div>

        {/* Engagement Comparison */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Engagement
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {comparison.engagementPercentile}%
            </span>
            <span className="text-xs text-slate-500">percentile</span>
          </div>
          <div className="flex items-center gap-1">
            {engagementDiff > 0 ? (
              <>
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">+{engagementDiff}%</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">{engagementDiff}%</span>
              </>
            )}
            <span className="text-xs text-slate-500">vs average</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          Benchmark Data
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Avg Views</p>
            <p className="font-semibold text-slate-900">
              {Math.round(Number(benchmark.avgViewCount) / 1000)}K
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Avg Engagement</p>
            <p className="font-semibold text-slate-900">{benchmark.avgEngagementRate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Your Views</p>
            <p className="font-semibold text-slate-900">
              {Math.round(Number(videoMetrics.views) / 1000)}K
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Your Engagement</p>
            <p className="font-semibold text-slate-900">
              {videoMetrics.engagementRate.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-700">
          {comparison.rank === 'top_10' && (
            '🚀 Exceptional performance! Your video is performing in the top tier for this niche.'
          )}
          {comparison.rank === 'top_25' && (
            '⭐ Great performance! Your video is among the best in this niche.'
          )}
          {comparison.rank === 'top_50' && (
            '✓ Good performance! Your video is performing well for this niche.'
          )}
          {comparison.rank === 'average' && (
            '📊 Average performance. There\'s room for improvement to stand out in this niche.'
          )}
          {comparison.rank === 'below_average' && (
            '📈 Below average performance. Consider improving content strategy for better results.'
          )}
        </p>
      </div>
    </motion.div>
  );
}
