"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import LockedFeatureCard from "@/components/LockedFeatureCard";

interface ViralPotentialCardProps {
  data: {
    score: number;
    factors: {
      velocityScore: number;
      sentimentScore: number;
      commentVelocityScore: number;
      likeRatioScore: number;
    };
    explanation: string;
    prediction: "viral" | "high_potential" | "moderate" | "low";
  } | null;
  isLoading?: boolean;
}

export default function ViralPotentialCard({
  data,
  isLoading = false,
}: ViralPotentialCardProps) {
  const { canUseViralScore, loading: tierLoading } = useTierAccess();

  // Show locked state for non-PRO users
  if (!tierLoading && !canUseViralScore) {
    return (
      <LockedFeatureCard feature="Viral Potential Score" requiredTier="PRO" />
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-20 bg-slate-200 rounded" />
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
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">Viral potential data not available</p>
        <p className="text-sm text-slate-400 mt-1">
          Please analyze a video to calculate viral potential
        </p>
      </motion.div>
    );
  }

  const { score, factors, explanation, prediction } = data;

  // Color coding based on prediction
  const getColorScheme = (pred: string) => {
    switch (pred) {
      case "viral":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          headerText: "text-red-700",
          scoreText: "text-red-600",
          badge: "bg-red-100 text-red-700",
        };
      case "high_potential":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          headerText: "text-orange-700",
          scoreText: "text-orange-600",
          badge: "bg-orange-100 text-orange-700",
        };
      case "moderate":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          headerText: "text-yellow-700",
          scoreText: "text-yellow-600",
          badge: "bg-yellow-100 text-yellow-700",
        };
      case "low":
      default:
        return {
          bg: "bg-slate-50",
          border: "border-slate-200",
          headerText: "text-slate-700",
          scoreText: "text-slate-600",
          badge: "bg-slate-100 text-slate-700",
        };
    }
  };

  const getPredictionLabel = (pred: string) => {
    switch (pred) {
      case "viral":
        return { icon: "🔥", label: "Viral Potential" };
      case "high_potential":
        return { icon: "⭐", label: "High Potential" };
      case "moderate":
        return { icon: "📊", label: "Moderate Performance" };
      case "low":
        return { icon: "📈", label: "Room for Growth" };
      default:
        return { icon: "📈", label: "Unknown" };
    }
  };

  const colors = getColorScheme(prediction);
  const label = getPredictionLabel(prediction);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-6 ${colors.bg} ${colors.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Viral Potential Score
            </h3>
          </div>
          <p className={`text-sm font-medium ${colors.headerText}`}>
            {label.icon} {label.label}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${colors.scoreText}`}>
            {score}
          </div>
          <div className="text-sm text-slate-500">out of 100</div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-slate-700 uppercase tracking-wide">
          Contributing Factors
        </p>

        <FactorBar
          label="Engagement Velocity"
          score={factors.velocityScore}
          color="from-blue-500 to-cyan-500"
        />
        <FactorBar
          label="Sentiment Momentum"
          score={factors.sentimentScore}
          color="from-emerald-500 to-teal-500"
        />
        <FactorBar
          label="Comment Activity"
          score={factors.commentVelocityScore}
          color="from-purple-500 to-pink-500"
        />
        <FactorBar
          label="Like Quality"
          score={factors.likeRatioScore}
          color="from-amber-500 to-orange-500"
        />
      </div>

      {/* Explanation */}
      <div className="pt-4 border-t border-slate-300">
        <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
      </div>

      {/* Recommendation */}
      <div className="mt-4 pt-4 border-t border-slate-300">
        {prediction === "viral" && (
          <p className="text-sm text-slate-700">
            <strong>🎯 Action:</strong> Your video has exceptional viral
            indicators! Consider amplifying through ads or social promotion
            while engagement momentum is high.
          </p>
        )}
        {prediction === "high_potential" && (
          <p className="text-sm text-slate-700">
            <strong>🎯 Action:</strong> Strong potential detected! Optimize
            thumbnail, title, and first-minute engagement to push into viral
            territory.
          </p>
        )}
        {prediction === "moderate" && (
          <p className="text-sm text-slate-700">
            <strong>🎯 Action:</strong> Average potential. Try creating similar
            content on trending topics or collaborate with creators to boost
            engagement.
          </p>
        )}
        {prediction === "low" && (
          <p className="text-sm text-slate-700">
            <strong>🎯 Action:</strong> Limited viral indicators. Focus on
            community engagement, follow-ups, or content strategy iteration.
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Factor progress bar component
function FactorBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="font-semibold text-slate-600">
          {Math.round(score)}/100
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
