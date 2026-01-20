"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import LockedFeatureCard from "@/components/LockedFeatureCard";

interface PostingTimeSlot {
  dayOfWeek: string;
  hourRange: string;
  averageEngagementRate: number;
  videoCount: number;
  confidence: "high" | "medium" | "low";
}

interface PostingTimeHeatmapProps {
  userId?: string;
  niche?: string;
}

export default function PostingTimeHeatmap({
  userId,
  niche,
}: PostingTimeHeatmapProps) {
  const { canUsePostingTimeOptimizer, loading: tierLoading } = useTierAccess();
  const [data, setData] = useState<{
    topSlots: PostingTimeSlot[];
    insights: string[];
    totalAnalyzed: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tierLoading) return;
    if (!canUsePostingTimeOptimizer) {
      setLoading(false);
      return;
    }

    // Fetch posting time recommendations
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const query = niche ? `?niche=${encodeURIComponent(niche)}` : "";
        const response = await fetch(`/api/predictive/posting-times${query}`);
        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else if (!result.success) {
          setError(
            result.error || "Failed to fetch posting time recommendations",
          );
        }
      } catch (err) {
        console.error("Failed to fetch posting time recommendations:", err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [canUsePostingTimeOptimizer, tierLoading, niche]);

  // Show locked banner for non-PRO users
  if (!tierLoading && !canUsePostingTimeOptimizer) {
    return (
      <LockedFeatureCard feature="Optimal Posting Times" requiredTier="PRO" />
    );
  }

  if (loading && tierLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-64" />
          <div className="h-40 bg-slate-200 rounded" />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 font-medium">
          Error Loading Recommendations
        </p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </motion.div>
    );
  }

  if (!data || data.topSlots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center"
      >
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Not enough data yet</p>
        <p className="text-sm text-slate-500 mt-1">
          {data?.totalAnalyzed === 0
            ? "Analyze your first video to get posting time recommendations."
            : "Analyze more videos to get personalized posting time recommendations."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          Optimal Posting Times
        </h3>
      </div>

      {/* Top Time Slots */}
      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
          Your Best Times to Post
        </p>

        {data.topSlots.map((slot, index) => (
          <motion.div
            key={`${slot.dayOfWeek}-${slot.hourRange}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {slot.dayOfWeek} at {slot.hourRange}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>
                    {slot.videoCount} video{slot.videoCount !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span className="capitalize">
                    {slot.confidence === "high"
                      ? "✓ High confidence"
                      : slot.confidence === "medium"
                        ? "◐ Medium confidence"
                        : "△ Low confidence"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right ml-2">
              <p className="text-lg font-bold text-blue-600">
                {slot.averageEngagementRate.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">Avg. Engagement</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-3">
            💡 Key Insights
          </p>
          <ul className="space-y-2">
            {data.insights.map((insight, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-sm text-slate-700 flex items-start gap-2"
              >
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{insight}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Based on analysis of {data.totalAnalyzed} of your videos. Schedule
          your next post at one of these times for maximum engagement.
        </p>
      </div>
    </motion.div>
  );
}
