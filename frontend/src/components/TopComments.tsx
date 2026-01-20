"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Smile, Meh, Frown } from "lucide-react";

function TopComments({ comments }) {
  if (!comments || comments.length === 0) return null;

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case "POSITIVE":
        return <Smile className="w-4 h-4 text-emerald-500" />;
      case "NEGATIVE":
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-primary-500" />;
    }
  };

  const getSentimentBg = (sentiment) => {
    switch (sentiment) {
      case "POSITIVE":
        return "bg-emerald-50 border-emerald-100";
      case "NEGATIVE":
        return "bg-red-50 border-red-100";
      default:
        return "bg-primary-50 border-primary-100";
    }
  };

  // Calculate overall sentiment
  const sentimentCounts = comments.reduce(
    (acc, comment) => {
      acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const dominantSentiment =
    Object.entries(sentimentCounts).sort(
      (a, b) => (b[1] as number) - (a[1] as number),
    )[0]?.[0] || "NEUTRAL";

  const getSentimentLabel = (sentiment) => {
    switch (sentiment) {
      case "POSITIVE":
        return {
          text: "Positive",
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        };
      case "NEGATIVE":
        return {
          text: "Negative",
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      default:
        return {
          text: "Neutral",
          color: "text-primary-600",
          bg: "bg-primary-50",
          border: "border-primary-200",
        };
    }
  };

  const sentimentLabel = getSentimentLabel(dominantSentiment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl p-4 sm:p-6 shadow-card border border-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-50">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Top Comments
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Most relevant comments with sentiment
            </p>
          </div>
        </div>

        {/* Overall Sentiment Label */}
        <div
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border self-start sm:self-auto ${sentimentLabel.bg} ${sentimentLabel.border}`}
        >
          {getSentimentIcon(dominantSentiment)}
          <span
            className={`text-xs sm:text-sm font-medium ${sentimentLabel.color}`}
          >
            {sentimentLabel.text} Center
          </span>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3 sm:space-y-4">
        {comments.slice(0, 6).map((comment, index) => (
          <motion.div
            key={comment.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`p-3 sm:p-4 rounded-xl border ${getSentimentBg(comment.sentiment)}`}
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                {/* Author */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0">
                    {comment.authorName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-slate-700 text-xs sm:text-sm truncate">
                    {comment.authorName || "Anonymous"}
                  </span>
                </div>

                {/* Content */}
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {comment.content?.replace(/<[^>]*>/g, "") || "No content"}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ThumbsUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-xs">{comment.likeCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Sentiment indicator */}
              <div className="flex-shrink-0">
                <div
                  className={`p-1.5 sm:p-2 rounded-lg ${
                    comment.sentiment === "POSITIVE"
                      ? "bg-emerald-100"
                      : comment.sentiment === "NEGATIVE"
                        ? "bg-red-100"
                        : "bg-primary-100"
                  }`}
                >
                  {getSentimentIcon(comment.sentiment)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show more hint */}
      {comments.length > 6 && (
        <p className="text-center text-sm text-slate-400 mt-4">
          Showing 6 of {comments.length} analyzed comments
        </p>
      )}
    </motion.div>
  );
}

export default TopComments;
