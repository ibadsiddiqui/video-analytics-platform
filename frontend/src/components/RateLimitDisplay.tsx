"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Lock } from "lucide-react";

interface RateLimitDisplayProps {
  requestsRemaining: number;
  requestsLimit: number;
  isLimitReached: boolean;
  resetAt: Date | null;
  isAuthenticated: boolean;
}

function RateLimitDisplay({
  requestsRemaining,
  requestsLimit,
  isLimitReached,
  resetAt,
  isAuthenticated,
}: RateLimitDisplayProps): React.JSX.Element | null {
  // Don't show for authenticated users
  if (isAuthenticated) {
    return null;
  }

  // Calculate warning threshold
  const isWarning = requestsRemaining > 0 && requestsRemaining <= 2;

  const formatResetTime = (date: Date): string => {
    const now = new Date();
    const hours = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const minutes = Math.floor(
      ((date.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60),
    );

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        p-4 rounded-xl border-2 transition-all duration-300
        ${
          isLimitReached
            ? "bg-red-50 border-red-200 shadow-lg shadow-red-100"
            : isWarning
              ? "bg-amber-50 border-amber-200 shadow-lg shadow-amber-100"
              : "bg-slate-50 border-slate-200 shadow-lg shadow-slate-100"
        }
      `}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status indicator and text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {isLimitReached && (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          {isWarning && (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          {!isLimitReached && !isWarning && (
            <Lock className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <p
              className={`
                font-semibold text-sm sm:text-base
                ${
                  isLimitReached
                    ? "text-red-900"
                    : isWarning
                      ? "text-amber-900"
                      : "text-slate-900"
                }
              `}
            >
              {isLimitReached
                ? "Daily limit reached"
                : isWarning
                  ? `Low on requests: ${requestsRemaining} remaining`
                  : `${requestsRemaining} free ${requestsRemaining === 1 ? "request" : "requests"} today`}
            </p>
            {!isLimitReached && resetAt && (
              <p
                className={`
                  text-xs mt-1
                  ${isWarning ? "text-amber-700" : "text-slate-600"}
                `}
              >
                {formatResetTime(resetAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade prompt for limit reached */}
      {isLimitReached && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 text-sm text-red-700 font-medium"
        >
          Sign up for unlimited requests and more features
        </motion.p>
      )}
    </motion.div>
  );
}

export default RateLimitDisplay;
