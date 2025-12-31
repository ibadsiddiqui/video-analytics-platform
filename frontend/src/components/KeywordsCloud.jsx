'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hash, Tag } from 'lucide-react';

function KeywordsCloud({ keywords, hashtags }) {
  const hasKeywords = keywords && keywords.length > 0;
  const hasHashtags = hashtags && hashtags.length > 0;

  if (!hasKeywords && !hasHashtags) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-slate-100"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-amber-50">
          <Tag className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Top Keywords & Hashtags</h3>
          <p className="text-sm text-slate-500">Most mentioned terms in comments</p>
        </div>
      </div>

      {/* Hashtags */}
      {hasHashtags && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Hashtags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hashtags.slice(0, 8).map((tag, index) => (
              <motion.span
                key={tag.hashtag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-violet-50 text-primary-700 rounded-full text-sm font-medium border border-primary-100 hover:border-primary-200 transition-colors cursor-default"
              >
                {tag.hashtag}
                <span className="ml-1.5 text-primary-400">({tag.count})</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {hasKeywords && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Keywords</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 12).map((keyword, index) => {
              // Size based on score
              const maxScore = keywords[0]?.score || 1;
              const normalizedScore = keyword.score / maxScore;
              const sizeClass = normalizedScore > 0.7 
                ? 'text-base font-semibold' 
                : normalizedScore > 0.4 
                  ? 'text-sm font-medium' 
                  : 'text-xs font-medium';
              
              const bgClass = normalizedScore > 0.7 
                ? 'bg-slate-800 text-white' 
                : normalizedScore > 0.4 
                  ? 'bg-slate-200 text-slate-700' 
                  : 'bg-slate-100 text-slate-600';

              return (
                <motion.span
                  key={keyword.keyword}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className={`px-3 py-1.5 rounded-lg ${sizeClass} ${bgClass} hover:scale-105 transition-transform cursor-default`}
                >
                  {keyword.keyword}
                </motion.span>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state if both are empty after filtering */}
      {!hasHashtags && !hasKeywords && (
        <div className="text-center py-8 text-slate-400">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No keywords found in comments</p>
        </div>
      )}
    </motion.div>
  );
}

export default KeywordsCloud;
