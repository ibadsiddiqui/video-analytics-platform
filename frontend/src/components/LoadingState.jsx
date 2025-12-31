import React from 'react';
import { motion } from 'framer-motion';

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Video preview skeleton */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-80 flex-shrink-0">
            <div className="aspect-video md:aspect-auto md:h-48 skeleton" />
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="h-6 w-3/4 skeleton rounded" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 skeleton rounded-full" />
              <div className="space-y-2">
                <div className="h-4 w-32 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 skeleton rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-24 skeleton rounded" />
              <div className="h-4 w-20 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 skeleton rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-32 skeleton rounded" />
              <div className="h-3 w-24 skeleton rounded" />
            </div>
          </div>
          <div className="h-64 skeleton rounded-xl" />
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 skeleton rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-32 skeleton rounded" />
              <div className="h-3 w-24 skeleton rounded" />
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-40 h-40 skeleton rounded-full" />
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="loader mb-4" />
        <p className="text-slate-600 font-medium">Analyzing video...</p>
        <p className="text-sm text-slate-400 mt-1">This may take a few seconds</p>
      </div>
    </motion.div>
  );
}

export default LoadingState;
