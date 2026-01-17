/**
 * useBenchmark Hook
 * Fetch benchmark data for videos
 * Phase 2.1: Competitive Intelligence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VideoComparison } from '@/lib/services/benchmark';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function useBenchmark(videoId: string | null) {
  const [data, setData] = useState<VideoComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmark = useCallback(async () => {
    if (!videoId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/benchmarks/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        // Benchmark data not available yet - this is okay
        if (response.status === 404 || response.status === 500) {
          setData(null);
          return;
        }
        throw new Error(`Failed to fetch benchmark: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch benchmark data';
      setError(message);
      console.error('Benchmark fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchBenchmark();
  }, [fetchBenchmark]);

  return { data, loading, error, refetch: fetchBenchmark };
}

export default useBenchmark;
