"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  User,
  Type as TypeIcon,
  Sun,
  Palette,
  Maximize,
} from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import LockedFeatureCard from "@/components/LockedFeatureCard";
import type { ThumbnailAnalysis } from "@/lib/services/thumbnail-analyzer";

interface ThumbnailScoreCardProps {
  data?:
    | (ThumbnailAnalysis & { locked?: boolean; requiredTier?: string })
    | null;
  isLoading?: boolean;
}

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "from-emerald-400 to-emerald-600";
    if (s >= 60) return "from-blue-400 to-blue-600";
    if (s >= 40) return "from-amber-400 to-amber-600";
    return "from-red-400 to-red-600";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Average";
    return "Needs Work";
  };

  return (
    <div className="relative">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 flex items-center justify-center">
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${getScoreColor(score)} flex items-center justify-center shadow-lg`}
        >
          <span className="text-xl sm:text-2xl font-bold text-white">
            {score}
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-xs sm:text-sm font-medium text-slate-600">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function FactorBadge({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: "success" | "warning" | "error" | "unknown";
}) {
  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    unknown: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    unknown: AlertTriangle,
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs sm:text-sm ${colors[type]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function ThumbnailScoreCard({
  data,
  isLoading = false,
}: ThumbnailScoreCardProps) {
  const { canUseThumbnailAnalysis, loading: tierLoading } = useTierAccess();

  // Show locked state for non-PRO users or when data indicates locked
  if (!tierLoading && (!canUseThumbnailAnalysis || data?.locked)) {
    return (
      <LockedFeatureCard feature="Thumbnail Analysis" requiredTier="PRO" />
    );
  }

  // Extract analysis from data
  const analysis = data && !data.locked ? data : null;
  const thumbnailUrl = analysis?.url || "";

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="flex gap-4">
            <div className="w-32 h-20 bg-slate-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 text-center"
      >
        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">Thumbnail analysis not available</p>
        <p className="text-sm text-slate-400 mt-1">
          Analyze your video to get thumbnail insights
        </p>
      </motion.div>
    );
  }

  // Map factor values to badge types
  const getFactorType = (
    value: string,
  ): "success" | "warning" | "error" | "unknown" => {
    if (
      value === "hd" ||
      value === "likely" ||
      value === "high" ||
      value === "optimal" ||
      value === "standard"
    ) {
      return "success";
    }
    if (value === "sd" || value === "medium") {
      return "warning";
    }
    if (
      value === "low" ||
      value === "unlikely" ||
      value === "too_bright" ||
      value === "too_dark" ||
      value === "non_standard"
    ) {
      return "error";
    }
    return "unknown";
  };

  const formatFactorValue = (key: string, value: string): string => {
    const valueMap: Record<string, Record<string, string>> = {
      hasFace: {
        likely: "Detected",
        unlikely: "Not detected",
        unknown: "Unknown",
      },
      hasText: {
        likely: "Detected",
        unlikely: "Not detected",
        unknown: "Unknown",
      },
      colorContrast: {
        high: "High",
        medium: "Medium",
        low: "Low",
        unknown: "Unknown",
      },
      brightness: {
        optimal: "Optimal",
        too_bright: "Too bright",
        too_dark: "Too dark",
        unknown: "Unknown",
      },
      aspectRatio: {
        standard: "16:9 (Standard)",
        non_standard: "Non-standard",
      },
      resolution: {
        hd: "HD (1280x720+)",
        sd: "SD (640x360+)",
        low: "Low",
        unknown: "Unknown",
      },
    };
    return valueMap[key]?.[value] || value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-2 sm:p-2.5 rounded-xl bg-pink-50">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
            Thumbnail Analysis
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Visual effectiveness score
          </p>
        </div>
      </div>

      {/* Thumbnail Preview and Score */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-center sm:justify-start">
          <ScoreGauge score={analysis.score} />
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Analysis Factors
        </h4>
        <div className="flex flex-wrap gap-2">
          <FactorBadge
            label="Resolution"
            value={formatFactorValue("resolution", analysis.factors.resolution)}
            type={getFactorType(analysis.factors.resolution)}
          />
          <FactorBadge
            label="Aspect Ratio"
            value={formatFactorValue(
              "aspectRatio",
              analysis.factors.aspectRatio,
            )}
            type={getFactorType(analysis.factors.aspectRatio)}
          />
          {analysis.factors.hasFace !== "unknown" && (
            <FactorBadge
              label="Face"
              value={formatFactorValue("hasFace", analysis.factors.hasFace)}
              type={getFactorType(analysis.factors.hasFace)}
            />
          )}
          {analysis.factors.hasText !== "unknown" && (
            <FactorBadge
              label="Text"
              value={formatFactorValue("hasText", analysis.factors.hasText)}
              type={getFactorType(analysis.factors.hasText)}
            />
          )}
          {analysis.factors.colorContrast !== "unknown" && (
            <FactorBadge
              label="Contrast"
              value={formatFactorValue(
                "colorContrast",
                analysis.factors.colorContrast,
              )}
              type={getFactorType(analysis.factors.colorContrast)}
            />
          )}
          {analysis.factors.brightness !== "unknown" && (
            <FactorBadge
              label="Brightness"
              value={formatFactorValue(
                "brightness",
                analysis.factors.brightness,
              )}
              type={getFactorType(analysis.factors.brightness)}
            />
          )}
        </div>
      </div>

      {/* Best Practices Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Followed */}
        {analysis.bestPractices.followed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-emerald-700 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Following
            </h4>
            <ul className="space-y-1">
              {analysis.bestPractices.followed.map((practice, index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-slate-600 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {practice}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing */}
        {analysis.bestPractices.missing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-amber-700 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              To Improve
            </h4>
            <ul className="space-y-1">
              {analysis.bestPractices.missing.map((practice, index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-slate-600 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {practice}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="pt-4 sm:pt-6 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {analysis.recommendations.slice(0, 4).map((rec, index) => (
              <li
                key={index}
                className="text-xs sm:text-sm text-slate-600 flex items-start gap-2"
              >
                <span className="text-primary-500 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
