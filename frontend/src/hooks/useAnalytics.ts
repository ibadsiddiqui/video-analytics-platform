'use client';

import { useState, useCallback, useRef } from 'react';
import { getBrowserFingerprint } from '@/utils/fingerprint';
import { syncTrackingWithHeaders } from '@/hooks/useAnonymousTracking';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface AnalyzeOptions {
  apiKey?: string;
  skipCache?: boolean;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
}

interface AnalyticsData {
  video: {
    platform: string;
    id: string;
    url: string;
    title: string;
    description?: string;
    thumbnail?: string;
    publishedAt?: string;
    duration?: number;
    durationFormatted: string;
  };
  channel: {
    name: string;
    id: string;
    thumbnail?: string;
    subscribers?: number;
    subscribersFormatted: string;
  };
  metrics: {
    views: number;
    viewsFormatted: string;
    likes: number;
    likesFormatted: string;
    comments: number;
    commentsFormatted: string;
    shares: number;
    sharesFormatted: string;
    engagementRate: number;
    engagementRateFormatted: string;
  };
  engagement: {
    byDay: Array<{ day: string; engagement: number; views: number }>;
    peakDay: { day: string; engagement: number; views: number } | null;
  };
  sentiment: {
    overall: { score: number; sentiment: string };
    distribution: { positive: number; neutral: number; negative: number };
    totalAnalyzed: number;
  } | null;
  keywords: Array<{ keyword: string; score: number }>;
  hashtags: Array<{ hashtag: string; count: number }>;
  demographics: {
    ageDistribution: Array<{ range: string; percentage: number }>;
    genderSplit: { male: number; female: number };
  };
  topComments: any[];
  meta: {
    fetchedAt: string;
    fromCache: boolean;
    platform: string;
  };
}

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string | null;
}

interface CachedAnalysis {
  url: string;
  data: AnalyticsData;
  timestamp: number;
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  analyze: (url: string, options?: AnalyzeOptions) => Promise<AnalyticsData>;
  reset: () => void;
  rateLimit: RateLimitInfo | null;
  isCached: boolean;
  lastAnalyzedUrl: string | null;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  // Use ref to store cached analysis across renders
  // This prevents duplicate requests when the same URL is analyzed multiple times
  const cachedAnalysisRef = useRef<CachedAnalysis | null>(null);

  const analyze = useCallback(async (url: string, options: AnalyzeOptions = {}): Promise<AnalyticsData> => {
    // Normalize URL for comparison (trim whitespace)
    const normalizedUrl = url.trim();

    // Check if we have cached data for this exact URL and skipCache is not set
    if (
      !options.skipCache &&
      cachedAnalysisRef.current &&
      cachedAnalysisRef.current.url === normalizedUrl
    ) {
      // Show cached data without loading state
      setData(cachedAnalysisRef.current.data);
      setIsCached(true);
      setError(null);
      setLoading(false);
      return cachedAnalysisRef.current.data;
    }

    // New URL or skipCache is true, make API request
    setLoading(true);
    setError(null);
    setData(null);
    setIsCached(false);

    try {
      // Get browser fingerprint for anonymous tracking
      const fingerprint = await getBrowserFingerprint();

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Fingerprint': fingerprint,
        },
        body: JSON.stringify({
          url: normalizedUrl,
          ...options,
        }),
      });

      const result = await response.json();

      // Extract rate limit headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      if (rateLimitRemaining && rateLimitLimit) {
        const rateLimitState: RateLimitInfo = {
          remaining: parseInt(rateLimitRemaining, 10),
          limit: parseInt(rateLimitLimit, 10),
          resetAt: rateLimitReset || null,
        };
        setRateLimit(rateLimitState);

        // Sync with local tracking
        syncTrackingWithHeaders(rateLimitRemaining, rateLimitLimit, rateLimitReset || undefined);
      }

      if (!response.ok) {
        // Handle rate limit exceeded (429)
        if (response.status === 429) {
          throw new Error('Daily request limit reached. Please sign up for unlimited access.');
        }
        throw new Error(result.error || 'Failed to analyze video');
      }

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Cache the successful analysis
      cachedAnalysisRef.current = {
        url: normalizedUrl,
        data: result.data,
        timestamp: Date.now(),
      };

      setData(result.data);
      setIsCached(false);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback((): void => {
    setData(null);
    setError(null);
    setLoading(false);
    setIsCached(false);
  }, []);

  return {
    data,
    loading,
    error,
    analyze,
    reset,
    rateLimit,
    isCached,
    lastAnalyzedUrl: cachedAnalysisRef.current?.url || null,
  };
}

export default useAnalytics;
