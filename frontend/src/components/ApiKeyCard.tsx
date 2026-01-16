"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Youtube,
  Instagram,
  Trash2,
  Zap,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import type { ApiKey } from "@/types/apiKey";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onDelete: (apiKey: ApiKey) => void;
  onToggle: (apiKey: ApiKey) => void;
  onTest: (apiKey: ApiKey) => void;
  isLoading?: boolean;
}

const PLATFORM_CONFIG = {
  YOUTUBE: {
    name: "YouTube",
    icon: Youtube,
    gradient: "from-red-500/10 to-red-600/10",
    border: "border-red-500/30",
    color: "text-red-600",
    badge: "bg-red-100 text-red-700",
  },
  INSTAGRAM: {
    name: "Instagram",
    icon: Instagram,
    gradient: "from-purple-500/10 to-pink-600/10",
    border: "border-purple-500/30",
    color: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
} as const;

export default function ApiKeyCard({
  apiKey,
  onDelete,
  onToggle,
  onTest,
  isLoading = false,
}: ApiKeyCardProps): React.JSX.Element {
  const config = PLATFORM_CONFIG[apiKey.platform];
  const IconComponent = config.icon;

  const formatLastUsed = (dateString: string | null): string => {
    if (!dateString) return "Never used";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    }
    return "Just now";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative p-5 rounded-xl border-2 transition-all duration-300
        bg-gradient-to-br ${config.gradient} ${config.border}
        hover:shadow-lg
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Platform Icon */}
          <div className={`p-2.5 ${config.badge} rounded-lg`}>
            <IconComponent className={`w-5 h-5 ${config.color}`} />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {config.name}
            </p>
            {apiKey.label && (
              <p className="text-sm font-semibold text-slate-900 truncate">
                {apiKey.label}
              </p>
            )}
            <p
              className={`text-xs ${apiKey.label ? "text-slate-500" : "text-slate-700 font-medium"}`}
            >
              {apiKey.label ? apiKey.maskedKey : `Key: ${apiKey.maskedKey}`}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span
            className={`
              inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
              ${
                apiKey.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-200 text-slate-600"
              }
            `}
          >
            {apiKey.isActive ? "● Active" : "● Inactive"}
          </span>
        </div>
      </div>

      {/* Key Display */}
      <div className="mb-4">
        <code className="block px-3 py-2 bg-white/50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 break-all">
          {apiKey.maskedKey}
        </code>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-slate-600 mb-4 pb-4 border-b border-slate-200/50">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last used: {formatLastUsed(apiKey.lastUsedAt)}</span>
        </div>
        <span className="text-slate-500">
          {new Date(apiKey.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onToggle(apiKey);
          }}
          disabled={isLoading}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              apiKey.isActive
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }
          `}
          title={apiKey.isActive ? "Deactivate key" : "Activate key"}
        >
          {apiKey.isActive ? (
            <>
              <ToggleRight className="w-4 h-4" />
              <span className="hidden sm:inline">Deactivate</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Activate</span>
            </>
          )}
        </motion.button>

        {/* Test Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!apiKey.isActive) {
              toast.error("Activate the key first before testing");
              return;
            }
            onTest(apiKey);
          }}
          disabled={isLoading}
          className="
            flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700
            hover:bg-blue-200 rounded-lg font-semibold text-sm
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="Test API key validity"
        >
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Test</span>
        </motion.button>

        {/* Delete Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(apiKey)}
          disabled={isLoading}
          className="
            flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700
            hover:bg-red-200 rounded-lg font-semibold text-sm
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="Delete API key"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
