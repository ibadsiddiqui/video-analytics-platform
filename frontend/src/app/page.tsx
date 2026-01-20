"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MetricsGrid from "@/components/MetricsGrid";
import EngagementChart from "@/components/EngagementChart";
import SentimentChart from "@/components/SentimentChart";
import DemographicsChart from "@/components/DemographicsChart";
import KeywordsCloud from "@/components/KeywordsCloud";
import TopComments from "@/components/TopComments";
import VideoPreview from "@/components/VideoPreview";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import UpgradePrompt from "@/components/UpgradePrompt";
import RateLimitDisplay from "@/components/RateLimitDisplay";
import BenchmarkCard from "@/components/BenchmarkCard";
import ViralPotentialCard from "@/components/ViralPotentialCard";
import PostingTimeHeatmap from "@/components/PostingTimeHeatmap";
import TitleAnalysisCard from "@/components/TitleAnalysisCard";
import ThumbnailScoreCard from "@/components/ThumbnailScoreCard";
import AudienceOverlapCard from "@/components/AudienceOverlapCard";
import SuperfansCard from "@/components/SuperfansCard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAnonymousTracking } from "@/hooks/useAnonymousTracking";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useBenchmark } from "@/hooks/useBenchmark";

export default function Home(): React.JSX.Element {
  const [url, setUrl] = useState<string>("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<boolean>(false);

  // New: API key selection state
  const [selectedYoutubeKeyId, setSelectedYoutubeKeyId] = useState<
    string | null
  >(null);
  const [selectedInstagramKeyId, setSelectedInstagramKeyId] = useState<
    string | null
  >(null);

  const { user } = useUser();
  const { data, loading, error, analyze, isCached } = useAnalytics();
  const {
    requestsRemaining,
    requestsLimit,
    resetAt,
    incrementRequest,
    isLimitReached,
  } = useAnonymousTracking();

  // Fetch benchmark comparison data
  const { data: benchmarkData, loading: benchmarkLoading } = useBenchmark(
    data?.video?.id || null,
  );

  // Fetch user's API keys if authenticated
  const {
    keys: userKeys,
    loading: userKeysLoading,
    refetch: refetchKeys,
  } = useApiKeys();

  // Load keys on mount for authenticated users
  useEffect(() => {
    if (user) {
      refetchKeys();
    }
  }, [user, refetchKeys]);

  // Load selected key IDs from localStorage on mount
  useEffect(() => {
    const savedYoutubeKeyId = localStorage.getItem("selected_youtube_key_id");
    const savedInstagramKeyId = localStorage.getItem(
      "selected_instagram_key_id",
    );

    if (savedYoutubeKeyId) {
      setSelectedYoutubeKeyId(savedYoutubeKeyId);
    }
    if (savedInstagramKeyId) {
      setSelectedInstagramKeyId(savedInstagramKeyId);
    }
  }, []);

  // Save selected key IDs to localStorage whenever they change
  useEffect(() => {
    if (selectedYoutubeKeyId) {
      localStorage.setItem("selected_youtube_key_id", selectedYoutubeKeyId);
    } else {
      localStorage.removeItem("selected_youtube_key_id");
    }
  }, [selectedYoutubeKeyId]);

  useEffect(() => {
    if (selectedInstagramKeyId) {
      localStorage.setItem("selected_instagram_key_id", selectedInstagramKeyId);
    } else {
      localStorage.removeItem("selected_instagram_key_id");
    }
  }, [selectedInstagramKeyId]);

  const handleAnalyze = useCallback(
    async (videoUrl: string): Promise<void> => {
      if (!videoUrl.trim()) {
        toast.error("Please enter a valid URL");
        return;
      }

      // Check if anonymous user has reached limit
      if (!user && isLimitReached) {
        setShowUpgradePrompt(true);
        toast.error(
          "Daily request limit reached. Please sign up for unlimited access.",
        );
        return;
      }

      try {
        await analyze(videoUrl, {
          youtubeKeyId: selectedYoutubeKeyId || undefined,
          instagramKeyId: selectedInstagramKeyId || undefined,
        });

        // Only increment rate limit for new requests (not cached results)
        // Only count for anonymous users
        if (!isCached && !user) {
          incrementRequest();
        }

        // Show appropriate toast based on whether data was cached
        if (isCached) {
          toast.success("Showing cached results for this video");
        } else {
          toast.success("Analysis complete!");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to analyze video");
        // Show upgrade prompt for rate limit errors
        if (err.message?.includes("Daily request limit reached")) {
          setShowUpgradePrompt(true);
        }
      }
    },
    [
      analyze,
      selectedYoutubeKeyId,
      selectedInstagramKeyId,
      user,
      isLimitReached,
      incrementRequest,
      isCached,
    ],
  );

  return (
    <div className="min-h-screen bg-mesh">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      {/* Background decorations - hidden on mobile for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-40 sm:w-60 h-40 sm:h-60 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-32 sm:w-40 h-32 sm:h-40 bg-accent-pink/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Rate limit display for anonymous users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <RateLimitDisplay
                requestsRemaining={requestsRemaining}
                requestsLimit={requestsLimit}
                isLimitReached={isLimitReached}
                resetAt={resetAt}
                isAuthenticated={!!user}
              />
            </motion.div>
          )}

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8 lg:mb-10"
          >
            <SearchBar
              url={url}
              setUrl={setUrl}
              onAnalyze={handleAnalyze}
              loading={loading}
              selectedYoutubeKeyId={selectedYoutubeKeyId}
              setSelectedYoutubeKeyId={setSelectedYoutubeKeyId}
              selectedInstagramKeyId={selectedInstagramKeyId}
              setSelectedInstagramKeyId={setSelectedInstagramKeyId}
              userKeys={userKeys}
              userKeysLoading={userKeysLoading}
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
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Analysis Failed
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">{error}</p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 sm:space-y-6 lg:space-y-8"
              >
                {/* Video Preview */}
                <VideoPreview video={data.video} channel={data.channel} />

                {/* Metrics Grid */}
                <MetricsGrid metrics={data.metrics} />

                {/* Benchmark Card */}
                <BenchmarkCard
                  data={benchmarkData}
                  isLoading={benchmarkLoading}
                />

                {/* Phase 3: Predictive Analytics */}
                {data.predictive && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <ViralPotentialCard
                      data={data.predictive.viralPotential || null}
                      isLoading={false}
                    />
                    <PostingTimeHeatmap
                      userId={user?.id}
                      niche={data.video?.title}
                    />
                  </div>
                )}

                {/* Phase 4: Content Strategy Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <TitleAnalysisCard
                    data={null}
                    isLoading={false}
                  />
                  <ThumbnailScoreCard
                    data={null}
                    isLoading={false}
                  />
                </div>

                {/* Phase 5: Audience Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <AudienceOverlapCard
                    data={null}
                    isLoading={false}
                  />
                  <SuperfansCard
                    data={null}
                    isLoading={false}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <EngagementChart data={data.engagement} />
                  <SentimentChart sentiment={data.sentiment} />
                </div>

                {/* Demographics and Keywords */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <DemographicsChart demographics={data.demographics} />
                  <KeywordsCloud
                    keywords={data.keywords}
                    hashtags={data.hashtags}
                  />
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
        <footer className="py-6 sm:py-8 text-center text-slate-500 text-xs sm:text-sm px-4">
          <p>
            Built by{" "}
            <span className="font-semibold text-primary-600">
              Ibad Siddiqui
            </span>{" "}
            • Video Analytics Platform
          </p>
        </footer>
      </div>

      {/* Upgrade prompt modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        requestsLimit={requestsLimit}
        resetAt={resetAt}
      />
    </div>
  );
}
