import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import MetricsGrid from './components/MetricsGrid';
import EngagementChart from './components/EngagementChart';
import SentimentChart from './components/SentimentChart';
import DemographicsChart from './components/DemographicsChart';
import KeywordsCloud from './components/KeywordsCloud';
import TopComments from './components/TopComments';
import VideoPreview from './components/VideoPreview';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import { useAnalytics } from './hooks/useAnalytics';

function App() {
  const [url, setUrl] = useState('');
  const { data, loading, error, analyze } = useAnalytics();

  const handleAnalyze = useCallback(async (videoUrl) => {
    if (!videoUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      await analyze(videoUrl);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.message || 'Failed to analyze video');
    }
  }, [analyze]);

  return (
    <div className="min-h-screen bg-mesh">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-accent-pink/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <SearchBar 
              url={url}
              setUrl={setUrl}
              onAnalyze={handleAnalyze}
              loading={loading}
            />
          </motion.div>

          {/* Content Section */}
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingState key="loading" />
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-20"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Analysis Failed</h3>
                <p className="text-slate-600 max-w-md mx-auto">{error}</p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Video Preview */}
                <VideoPreview video={data.video} channel={data.channel} />

                {/* Metrics Grid */}
                <MetricsGrid metrics={data.metrics} />

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EngagementChart data={data.engagement} />
                  <SentimentChart sentiment={data.sentiment} />
                </div>

                {/* Demographics and Keywords */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DemographicsChart demographics={data.demographics} />
                  <KeywordsCloud keywords={data.keywords} hashtags={data.hashtags} />
                </div>

                {/* Top Comments */}
                {data.topComments && data.topComments.length > 0 && (
                  <TopComments comments={data.topComments} />
                )}
              </motion.div>
            ) : (
              <EmptyState key="empty" />
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-slate-500 text-sm">
          <p>Built by <span className="font-semibold text-primary-600">Ibad Siddiqui</span> • Video Analytics Platform</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
