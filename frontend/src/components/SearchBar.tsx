"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Youtube,
  Instagram,
  Loader2,
  Link2,
  Key,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";
import { useUser } from "@clerk/nextjs";
import ApiKeySelector from "./ApiKeySelector";
import type { ApiKey } from "@/types/apiKey";

interface SearchBarProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (url: string) => void;
  loading: boolean;
  // New: API key selection
  selectedYoutubeKeyId: string | null;
  setSelectedYoutubeKeyId: (keyId: string | null) => void;
  selectedInstagramKeyId: string | null;
  setSelectedInstagramKeyId: (keyId: string | null) => void;
  userKeys: ApiKey[];
  userKeysLoading?: boolean;
}

function SearchBar({
  url,
  setUrl,
  onAnalyze,
  loading,
  selectedYoutubeKeyId,
  setSelectedYoutubeKeyId,
  selectedInstagramKeyId,
  setSelectedInstagramKeyId,
  userKeys,
  userKeysLoading = false,
}: SearchBarProps): React.JSX.Element {
  const [focused, setFocused] = useState<boolean>(false);
  const [showApiKeys, setShowApiKeys] = useState<boolean>(false);
  const { user } = useUser();
  const { isLimitReached } = useAnonymousTracking();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onAnalyze(url);
  };

  const detectPlatform = (inputUrl: string): "youtube" | "instagram" | null => {
    if (inputUrl.includes("youtube.com") || inputUrl.includes("youtu.be")) {
      return "youtube";
    }
    if (inputUrl.includes("instagram.com")) {
      return "instagram";
    }
    return null;
  };

  const platform = detectPlatform(url);

  return (
    <div className="text-center mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Analyze Any Video
          <span className="gradient-text"> Instantly</span>
        </h2>
        <p className="text-slate-600 max-w-xl mx-auto mb-8">
          Paste a YouTube or Instagram video URL to get comprehensive analytics
          including views, engagement, sentiment analysis, and audience
          insights.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div
          className={`
            relative flex items-center gap-3 p-2 bg-white rounded-2xl border-2 transition-all duration-300
            ${focused ? "border-primary-500 shadow-lg shadow-primary-500/20" : "border-slate-200 shadow-soft"}
          `}
        >
          {/* Platform icon */}
          <div className="pl-4">
            {platform === "youtube" ? (
              <Youtube className="w-6 h-6 text-red-500" />
            ) : platform === "instagram" ? (
              <Instagram className="w-6 h-6 text-pink-500" />
            ) : (
              <Link2 className="w-6 h-6 text-slate-400" />
            )}
          </div>

          {/* Input */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Paste YouTube or Instagram video URL..."
            className="flex-1 py-3 px-2 text-slate-900 placeholder-slate-400 bg-transparent outline-none text-lg"
            disabled={loading}
          />

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading || !url.trim() || (isLimitReached && !user)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
              transition-all duration-300
              ${
                loading || !url.trim() || (isLimitReached && !user)
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25"
              }
            `}
            whileHover={
              !loading && url.trim() && !(isLimitReached && !user)
                ? { scale: 1.02 }
                : {}
            }
            whileTap={
              !loading && url.trim() && !(isLimitReached && !user)
                ? { scale: 0.98 }
                : {}
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : isLimitReached && !user ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Limit Reached</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analyze</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Supported platforms */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            YouTube
          </span>
          <span className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            Instagram
          </span>
        </div>

        {/* Optional API Keys - Only for authenticated users with CREATOR+ tier */}
        {user && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="button"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors mx-auto"
            >
              <Key className="w-4 h-4" />
              <span>Use your own API keys (optional)</span>
              {showApiKeys ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showApiKeys && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4"
              >
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>ℹ️ How it works:</strong> Select a stored API key
                    for each platform, or use the default system keys. Your keys
                    are encrypted and secure.
                  </p>
                </div>

                {/* YouTube API Key Selector */}
                <div className="border-l-4 border-red-500 pl-4">
                  <ApiKeySelector
                    platform="YOUTUBE"
                    selectedKeyId={selectedYoutubeKeyId}
                    onSelect={setSelectedYoutubeKeyId}
                    userKeys={userKeys}
                    loading={userKeysLoading}
                    disabled={loading}
                  />
                </div>

                {/* Instagram API Key Selector */}
                <div className="border-l-4 border-pink-500 pl-4">
                  <ApiKeySelector
                    platform="INSTAGRAM"
                    selectedKeyId={selectedInstagramKeyId}
                    onSelect={setSelectedInstagramKeyId}
                    userKeys={userKeys}
                    loading={userKeysLoading}
                    disabled={loading}
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800">
                    <strong>✅ Secure & Automatic:</strong> Your API keys are
                    encrypted and stored securely. The correct key is
                    automatically used based on the video platform you&apos;re
                    analyzing.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.form>
    </div>
  );
}

export default SearchBar;
