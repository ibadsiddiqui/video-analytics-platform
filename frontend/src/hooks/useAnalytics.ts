'use client';

import { useState, useCallback } from 'react';

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

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  analyze: (url: string, options?: AnalyzeOptions) => Promise<AnalyticsData>;
  reset: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (url: string, options: AnalyzeOptions = {}): Promise<AnalyticsData> => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          ...options,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze video');
      }

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setData(result.data);
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
  }, []);

  return {
    data,
    loading,
    error,
    analyze,
    reset,
  };
}

export default useAnalytics;
