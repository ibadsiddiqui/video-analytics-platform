/**
 * useCompetitors Hook
 * Manage competitor tracking
 * Phase 2.1: Competitor Tracking
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import type { Platform } from '@prisma/client';

export interface Competitor {
  id: string;
  channelName: string;
  channelUrl: string;
  niche: string;
  metrics: {
    subscriberCount: bigint;
    videoCount: number;
    totalViews: bigint;
    avgEngagement: number | null;
  };
  firstTrackedAt: Date;
  lastCheckedAt: Date | null;
  isActive: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function useCompetitors() {
  const { user } = useUser();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch competitors
  const refetch = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/competitors`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch competitors');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCompetitors(data.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch competitors';
      setError(message);
      console.error('Fetch competitors error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch, user]);

  // Add competitor
  const addCompetitor = useCallback(
    async (
      platform: Platform,
      channelId: string,
      channelName: string,
      channelUrl: string,
      thumbnailUrl?: string
    ) => {
      try {
        const response = await fetch(`${API_URL}/competitors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            platform,
            channelId,
            channelName,
            channelUrl,
            thumbnailUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to add competitor');
        }

        toast.success(`Now tracking ${channelName}`);
        setCompetitors(prev => [...prev, data.data]);
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add competitor';
        toast.error(message);
        throw err;
      }
    },
    []
  );

  // Remove competitor
  const removeCompetitor = useCallback(async (id: string, channelName: string) => {
    try {
      const response = await fetch(`${API_URL}/competitors/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove competitor');
      }

      toast.success(`Stopped tracking ${channelName}`);
      setCompetitors(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove competitor';
      toast.error(message);
      throw err;
    }
  }, []);

  // Get competitor history
  const getHistory = useCallback(async (id: string, days: number = 30) => {
    try {
      const response = await fetch(`${API_URL}/competitors/${id}?days=${days}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch competitor history');
      }

      const data = await response.json();
      return data.data || null;
    } catch (err) {
      console.error('Get history error:', err);
      throw err;
    }
  }, []);

  return {
    competitors,
    loading,
    error,
    refetch,
    addCompetitor,
    removeCompetitor,
    getHistory,
  };
}

export default useCompetitors;
