"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Star,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
  User,
  Crown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import LockedFeatureCard from "@/components/LockedFeatureCard";
import type { SuperfanAnalysisResult, Superfan } from "@/lib/services/audience-analyzer";

interface SuperfansCardProps {
  data?: SuperfanAnalysisResult | null;
  isLoading?: boolean;
}

function getSentimentColor(sentiment: number): string {
  if (sentiment >= 0.3) return "text-emerald-600";
  if (sentiment >= 0) return "text-blue-600";
  if (sentiment >= -0.3) return "text-amber-600";
  return "text-red-600";
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 0.3) return "Very Positive";
  if (sentiment >= 0) return "Positive";
  if (sentiment >= -0.3) return "Neutral";
  return "Critical";
}

function EngagementBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
    if (score >= 60) return "bg-gradient-to-r from-emerald-400 to-teal-500 text-white";
    if (score >= 40) return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white";
    return "bg-slate-200 text-slate-600";
  };

  const getLabel = () => {
    if (score >= 80) return "Super Fan";
    if (score >= 60) return "Loyal Fan";
    if (score >= 40) return "Active Fan";
    return "Fan";
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getColor()}`}>
      {getLabel()}
    </span>
  );
}

function SuperfanRow({ fan, rank }: { fan: Superfan; rank: number }) {
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-500" />;
    if (rank === 2) return <Star className="w-4 h-4 text-slate-400" />;
    if (rank === 3) return <Star className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 h-4 text-center text-xs text-slate-400">{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border border-slate-200">
        {getRankIcon()}
      </div>

      {/* Avatar & Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-900 text-sm truncate">
            {fan.username}
          </span>
          <EngagementBadge score={fan.engagementScore} />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {fan.totalComments} comments
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {fan.totalLikes} likes
          </span>
          <span className={`flex items-center gap-1 ${getSentimentColor(fan.avgSentiment)}`}>
            <Heart className="w-3 h-3" />
            {getSentimentLabel(fan.avgSentiment)}
          </span>
        </div>
      </div>

      {/* Engagement Score */}
      <div className="text-right">
        <div className="text-lg font-bold text-slate-900">{fan.engagementScore}</div>
        <div className="text-xs text-slate-500">score</div>
      </div>
    </motion.div>
  );
}

function ActivityIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-2 h-2 rounded-full ${
          isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
        }`}
      />
      <span className="text-xs text-slate-500">
        {isActive ? "Recently Active" : "Inactive"}
      </span>
    </div>
  );
}

export default function SuperfansCard({
  data,
  isLoading = false,
}: SuperfansCardProps) {
  const { canUseAudienceAnalytics, loading: tierLoading } = useTierAccess();

  // Show locked state for non-PRO users
  if (!tierLoading && !canUseAudienceAnalytics) {
    return (
      <LockedFeatureCard feature="Superfan Identification" requiredTier="PRO" />
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="space-y-3">
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="h-16 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data || data.superfans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 text-center"
      >
        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No superfans identified yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Analyze more videos with comments to discover your most engaged fans
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
            Your Superfans
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Most engaged community members
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-rose-600">
            {data.superfans.length}
          </div>
          <div className="text-xs text-slate-600">Total Superfans</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">
            {data.superfans.length > 0
              ? Math.round(
                  data.superfans.reduce((sum, f) => sum + f.engagementScore, 0) /
                    data.superfans.length
                )
              : 0}
          </div>
          <div className="text-xs text-slate-600">Avg Engagement</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            {data.superfans.filter((f) => f.isActive).length}
          </div>
          <div className="text-xs text-slate-600">Active Fans</div>
        </div>
      </div>

      {/* Top Superfan Highlight */}
      {data.superfans[0] && (
        <div className="mb-4 sm:mb-6 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">
              #1 Superfan
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-lg">
                {data.superfans[0].username}
              </p>
              <p className="text-sm text-slate-600">
                {data.superfans[0].totalComments} comments •{" "}
                {data.superfans[0].totalLikes} likes received
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-2xl font-bold">
                  {data.superfans[0].engagementScore}
                </span>
              </div>
              <ActivityIndicator isActive={data.superfans[0].isActive} />
            </div>
          </div>
        </div>
      )}

      {/* Superfan List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {data.superfans.slice(1).map((fan, index) => (
          <SuperfanRow key={fan.username} fan={fan} rank={index + 2} />
        ))}
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Insights
          </div>
          <ul className="space-y-2">
            {data.insights.map((insight, index) => (
              <li
                key={index}
                className="text-xs sm:text-sm text-slate-600 flex items-start gap-2"
              >
                <span className="text-primary-500 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
