"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Link2,
  TrendingUp,
  Handshake,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import LockedFeatureCard from "@/components/LockedFeatureCard";
import type {
  AudienceOverlapResult,
  ChannelOverlap,
} from "@/lib/services/audience-analyzer";

interface AudienceOverlapCardProps {
  data?: AudienceOverlapResult | null;
  isLoading?: boolean;
}

function CollaborationBadge({
  potential,
}: {
  potential: "high" | "medium" | "low";
}) {
  const colors = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${colors[potential]}`}
    >
      {potential === "high"
        ? "Ideal Partner"
        : potential === "medium"
          ? "Good Match"
          : "Low Match"}
    </span>
  );
}

function OverlapBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.5 }}
        className={`h-full rounded-full ${
          percentage >= 30
            ? "bg-gradient-to-r from-amber-400 to-orange-500"
            : percentage >= 10
              ? "bg-gradient-to-r from-emerald-400 to-teal-500"
              : "bg-gradient-to-r from-blue-400 to-cyan-500"
        }`}
      />
    </div>
  );
}

function ChannelOverlapItem({ channel }: { channel: ChannelOverlap }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-900 text-sm truncate">
            {channel.channelName}
          </span>
          <CollaborationBadge potential={channel.collaborationPotential} />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{channel.sharedCommenters} shared viewers</span>
          <span>•</span>
          <span>{channel.totalCommenters.toLocaleString()} total</span>
        </div>
        <div className="mt-2">
          <OverlapBar percentage={channel.overlapScore} />
        </div>
      </div>
      <div className="ml-4 text-right">
        <span className="text-lg font-bold text-slate-900">
          {channel.overlapScore}%
        </span>
        <p className="text-xs text-slate-500">overlap</p>
      </div>
    </motion.div>
  );
}

export default function AudienceOverlapCard({
  data,
  isLoading = false,
}: AudienceOverlapCardProps) {
  const { canUseAudienceAnalytics, loading: tierLoading } = useTierAccess();

  // Show locked state for non-PRO users
  if (!tierLoading && !canUseAudienceAnalytics) {
    return <LockedFeatureCard feature="Audience Overlap" requiredTier="PRO" />;
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

  if (!data || data.overlappingChannels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 text-center"
      >
        <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No audience overlap data available</p>
        <p className="text-sm text-slate-400 mt-1">
          Analyze more videos to discover audience connections
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
        <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50">
          <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
            Audience Overlap
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Channels with shared viewers
          </p>
        </div>
      </div>

      {/* Base Channel Stats */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">
              {data.baseChannel.channelName}
            </p>
            <p className="text-xs text-slate-500">Base channel</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-indigo-600">
              {data.baseChannel.totalCommenters.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">unique commenters</p>
          </div>
        </div>
      </div>

      {/* Top Collaboration Opportunities */}
      {data.topCollaborationOpportunities.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <Handshake className="w-4 h-4 text-emerald-500" />
            Top Collaboration Partners
          </div>
          <div className="grid gap-2 sm:gap-3">
            {data.topCollaborationOpportunities.slice(0, 3).map((channel) => (
              <div
                key={channel.channelId}
                className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                  {channel.channelName[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {channel.channelName}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {channel.overlapScore}% shared audience • Ideal partner
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Overlapping Channels */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <TrendingUp className="w-4 h-4" />
          All Overlapping Channels
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.overlappingChannels.map((channel) => (
            <ChannelOverlapItem key={channel.channelId} channel={channel} />
          ))}
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
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
