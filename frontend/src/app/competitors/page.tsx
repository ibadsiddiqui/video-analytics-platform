'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Plus, Trash2, TrendingUp, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useTierAccess } from '@/hooks/useTierAccess';
import Header from '@/components/Header';
import LockedFeatureBanner from '@/components/LockedFeatureBanner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function CompetitorsPage() {
  const { user, isLoaded } = useUser();
  const { competitors, loading, removeCompetitor } = useCompetitors();
  const { canTrackCompetitors, loading: tierLoading } = useTierAccess();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'YOUTUBE',
    channelName: '',
    channelUrl: '',
    channelId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  if (isLoaded && !user) {
    return (
      <div className="min-h-screen bg-mesh">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Sign in to track competitors
            </h2>
            <p className="text-slate-600">
              You need to be logged in to access the competitor tracking dashboard
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Show locked banner if user doesn't have access
  if (isLoaded && user && !tierLoading && !canTrackCompetitors) {
    return (
      <div className="min-h-screen bg-mesh">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LockedFeatureBanner
            feature="Competitor Tracking"
            requiredTier="PRO"
            description="Track competitor channels, monitor their growth, and compare performance metrics. Upgrade to PRO to unlock this feature."
          />
        </main>
      </div>
    );
  }

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement competitor addition
      toast.success(`Added ${formData.channelName} to tracking`);
      setShowAddModal(false);
      setFormData({
        platform: 'YOUTUBE',
        channelName: '',
        channelUrl: '',
        channelId: '',
      });
    } catch (error) {
      console.error('Error adding competitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Stop tracking ${name}?`)) {
      try {
        await removeCompetitor(id, name);
      } catch (error) {
        console.error('Error removing competitor:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Competitor Tracking</h1>
              <p className="text-slate-600 mt-2">
                Monitor and compare competitor channels in your niche
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Competitor
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : competitors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-slate-100"
          >
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No competitors tracked yet
            </h3>
            <p className="text-slate-600 mb-6">
              Start tracking competitors to see performance comparisons and growth trends
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Competitor
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {competitors.map(competitor => (
              <motion.div
                key={competitor.id}
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {competitor.channelName}
                    </h3>
                    <p className="text-sm text-primary-600 mt-1">{competitor.niche}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(competitor.id, competitor.channelName)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Subscribers</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round(Number(competitor.metrics.subscriberCount) / 1000)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Videos</span>
                    <span className="font-semibold text-slate-900">
                      {competitor.metrics.videoCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Views</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round(Number(competitor.metrics.totalViews) / 1000000)}M
                    </span>
                  </div>
                  {competitor.metrics.avgEngagement !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Avg Engagement</span>
                      <span className="font-semibold text-slate-900">
                        {competitor.metrics.avgEngagement.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Updated */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {competitor.lastCheckedAt
                      ? `Last updated: ${new Date(competitor.lastCheckedAt).toLocaleDateString()}`
                      : 'Just added'}
                  </p>
                </div>

                {/* View Details Link */}
                <a
                  href={`${competitor.channelUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  View on {competitor.niche === 'YOUTUBE' ? 'YouTube' : 'Platform'}
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add Competitor Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Competitor</h2>

                <form onSubmit={handleAddCompetitor} className="space-y-4">
                  {/* Platform Select */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={formData.platform}
                      onChange={e =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="YOUTUBE">YouTube</option>
                      <option value="INSTAGRAM">Instagram</option>
                    </select>
                  </div>

                  {/* Channel Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={formData.channelName}
                      onChange={e =>
                        setFormData({ ...formData, channelName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Tech Channel"
                      required
                    />
                  </div>

                  {/* Channel URL */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Channel URL
                    </label>
                    <input
                      type="url"
                      value={formData.channelUrl}
                      onChange={e =>
                        setFormData({ ...formData, channelUrl: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://youtube.com/@channel"
                      required
                    />
                  </div>

                  {/* Channel ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Channel ID
                    </label>
                    <input
                      type="text"
                      value={formData.channelId}
                      onChange={e =>
                        setFormData({ ...formData, channelId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="UC..."
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Add Competitor
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
