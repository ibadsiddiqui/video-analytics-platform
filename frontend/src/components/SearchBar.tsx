'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Youtube, Instagram, Loader2, Link2, Key, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface SearchBarProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (url: string) => void;
  loading: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
}

function SearchBar({ url, setUrl, onAnalyze, loading, apiKey, setApiKey }: SearchBarProps): React.JSX.Element {
  const [focused, setFocused] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('youtube_api_key');
    if (savedApiKey && setApiKey) {
      setApiKey(savedApiKey);
    }
  }, [setApiKey]);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('youtube_api_key', apiKey);
    }
  }, [apiKey]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onAnalyze(url);
  };

  const detectPlatform = (inputUrl: string): 'youtube' | 'instagram' | null => {
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      return 'youtube';
    }
    if (inputUrl.includes('instagram.com')) {
      return 'instagram';
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
          Paste a YouTube or Instagram video URL to get comprehensive analytics including 
          views, engagement, sentiment analysis, and audience insights.
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
            ${focused ? 'border-primary-500 shadow-lg shadow-primary-500/20' : 'border-slate-200 shadow-soft'}
          `}
        >
          {/* Platform icon */}
          <div className="pl-4">
            {platform === 'youtube' ? (
              <Youtube className="w-6 h-6 text-red-500" />
            ) : platform === 'instagram' ? (
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
            disabled={loading || !url.trim()}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
              transition-all duration-300
              ${loading || !url.trim() 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
              }
            `}
            whileHover={!loading && url.trim() ? { scale: 1.02 } : {}}
            whileTap={!loading && url.trim() ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
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

        {/* Optional YouTube API Key */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors mx-auto"
          >
            <Key className="w-4 h-4" />
            <span>Use your own YouTube API key (optional)</span>
            {showApiKey ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showApiKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              <label className="block text-sm font-medium text-slate-700 mb-2">
                YouTube Data API v3 Key
              </label>
              <input
                type="text"
                value={apiKey || ''}
                onChange={(e) => setApiKey && setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-xs text-slate-500">
                Don't have an API key?{' '}
                <Link
                  href="/guide/youtube-api-key"
                  className="text-primary-600 hover:text-primary-700 underline font-medium"
                >
                  Follow our step-by-step guide
                </Link>
                {' '}to get one from Google Cloud Platform. Your key is stored locally and used instead of the shared API key.
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.form>
    </div>
  );
}

export default SearchBar;
