'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Youtube, Instagram, Loader2, Link2 } from 'lucide-react';

function SearchBar({ url, setUrl, onAnalyze, loading }) {
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(url);
  };

  const detectPlatform = (inputUrl) => {
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
      </motion.form>
    </div>
  );
}

export default SearchBar;
