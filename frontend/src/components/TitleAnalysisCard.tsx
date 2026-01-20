"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Type,
  Lightbulb,
  Hash,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import LockedFeatureCard from "@/components/LockedFeatureCard";
import type {
  TitleAnalysis,
  TitleStyle,
} from "@/lib/services/title-analyzer";

interface TitleAnalysisCardProps {
  data?: (TitleAnalysis & { locked?: boolean; requiredTier?: string }) | null;
  isLoading?: boolean;
}

// Style colors for visual distinction
const styleColors: Record<TitleStyle, { bg: string; text: string; border: string }> = {
  QUESTION: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  NUMBERED_LIST: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  HOW_TO: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  EMOTIONAL: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  CLICKBAIT: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  STATEMENT: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  COMPARISON: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  TUTORIAL: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  NEWS: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  REVIEW: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

const styleLabels: Record<TitleStyle, string> = {
  QUESTION: "Question",
  NUMBERED_LIST: "Numbered List",
  HOW_TO: "How-To",
  EMOTIONAL: "Emotional",
  CLICKBAIT: "Clickbait",
  STATEMENT: "Statement",
  COMPARISON: "Comparison",
  TUTORIAL: "Tutorial",
  NEWS: "News",
  REVIEW: "Review",
};

function ScoreRing({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-blue-500";
    if (s >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Average";
    return "Needs Work";
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-100"
        />
        <circle
          cx="50%"
          cy="50%"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(score)}
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-slate-500">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

export default function TitleAnalysisCard({
  data,
  isLoading = false,
}: TitleAnalysisCardProps) {
  const { canUseTitleAnalysis, loading: tierLoading } = useTierAccess();

  // Show locked state for non-PRO users or when data indicates locked
  if (!tierLoading && (!canUseTitleAnalysis || data?.locked)) {
    return (
      <LockedFeatureCard feature="Title Analysis" requiredTier="PRO" />
    );
  }

  // Extract analysis from data
  const analysis = data && !data.locked ? data : null;

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
            <div className="w-24 h-24 bg-slate-200 rounded-full" />
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
        <Type className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">Title analysis not available</p>
        <p className="text-sm text-slate-400 mt-1">
          Enter a title to analyze its effectiveness
        </p>
      </motion.div>
    );
  }

  const colors = styleColors[analysis.style];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-2 sm:p-2.5 rounded-xl bg-violet-50">
          <Type className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
            Title Analysis
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Effectiveness score and recommendations
          </p>
        </div>
      </div>

      {/* Title Display */}
      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <p className="text-sm sm:text-base text-slate-800 font-medium line-clamp-2">
          &quot;{analysis.title}&quot;
        </p>
      </div>

      {/* Score and Style */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
        <ScoreRing score={analysis.score} />

        <div className="flex-1 text-center sm:text-left">
          {/* Style Badge */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
            >
              <Hash className="w-3.5 h-3.5" />
              {styleLabels[analysis.style]}
            </span>
          </div>

          {/* Characteristics */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {analysis.characteristics.hasNumbers && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                Contains Numbers
              </span>
            )}
            {analysis.characteristics.hasPowerWords && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                Power Words
              </span>
            )}
            {analysis.characteristics.hasQuestion && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Question Format
              </span>
            )}
            {analysis.characteristics.hasEmoji && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                Has Emoji
              </span>
            )}
            {analysis.characteristics.hasAllCaps && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                Contains ALL CAPS
              </span>
            )}
          </div>

          {/* Word/Character Count */}
          <div className="flex gap-4 mt-3 text-xs sm:text-sm text-slate-500 justify-center sm:justify-start">
            <span>{analysis.characteristics.wordCount} words</span>
            <span>{analysis.characteristics.charCount} characters</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Recommendations
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.slice(0, 4).map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs sm:text-sm text-slate-600"
              >
                {rec.includes("Great") || rec.includes("well") ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : rec.includes("Avoid") || rec.includes("penalty") ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </motion.div>
  );
}
