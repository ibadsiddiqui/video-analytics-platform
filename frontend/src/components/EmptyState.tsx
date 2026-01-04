"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Youtube,
  Instagram,
  BarChart3,
  Sparkles,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "View Analytics",
    description: "Track views, likes, comments, and engagement metrics",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: MessageSquare,
    title: "Sentiment Analysis",
    description: "AI-powered analysis of comment sentiment",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: BarChart3,
    title: "Audience Insights",
    description: "Demographics and engagement patterns",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Hero illustration */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative inline-block"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-xl shadow-primary-500/30">
            <BarChart3 className="w-16 h-16 text-white" />
          </div>

          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
              <Youtube className="w-5 h-5 text-white" />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -bottom-2 -left-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Instagram className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            Ready to Analyze Your Videos
          </h3>
          <p className="text-slate-600 max-w-lg mx-auto">
            Paste a YouTube or Instagram video URL above to get started with
            comprehensive analytics and AI-powered insights.
          </p>
        </motion.div>
      </div>

      {/* Features grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 hover:shadow-card-hover transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
            >
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">
              {feature.title}
            </h4>
            <p className="text-sm text-slate-600">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Example URLs */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-slate-500 mb-3 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Try analyzing any video from these platforms
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="#"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Could auto-fill a sample URL
            }}
          >
            youtube.com/watch?v=...
          </a>
          <a
            href="#"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Could auto-fill a sample URL
            }}
          >
            instagram.com/reel/...
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EmptyState;
