"use client";

import { useState, useEffect, useCallback } from "react";

const DAILY_LIMIT = 5; // Default daily limit for anonymous users
const STORAGE_PREFIX = "anonymous_requests";

/**
 * Anonymous request tracking data structure
 */
interface TrackingData {
  count: number;
  resetAt: string; // ISO date string for when the limit resets
  fingerprint?: string;
}

/**
 * Return type for the tracking hook
 */
export interface UseAnonymousTrackingReturn {
  requestsRemaining: number;
  requestsLimit: number;
  resetAt: Date | null;
  incrementRequest: () => void;
  isLimitReached: boolean;
  resetDate: string; // YYYY-MM-DD
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Get tomorrow's date at midnight in ISO string format
 */
function getTomorrowMidnight(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Get tracking data from localStorage for today
 */
function getTrackingData(): TrackingData {
  if (typeof window === "undefined") {
    return {
      count: 0,
      resetAt: getTomorrowMidnight(),
    };
  }

  try {
    const today = getTodayString();
    const key = `${STORAGE_PREFIX}_${today}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading tracking data from localStorage:", error);
  }

  return {
    count: 0,
    resetAt: getTomorrowMidnight(),
  };
}

/**
 * Save tracking data to localStorage
 */
function saveTrackingData(data: TrackingData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const today = getTodayString();
    const key = `${STORAGE_PREFIX}_${today}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving tracking data to localStorage:", error);
  }
}

/**
 * Clean up old tracking data from localStorage
 */
function cleanupOldData(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const today = getTodayString();
    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        // Extract date from key (format: anonymous_requests_YYYY-MM-DD)
        const datePart = key.replace(`${STORAGE_PREFIX}_`, "");
        // Delete if not today's date
        if (datePart !== today && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error cleaning up old tracking data:", error);
  }
}

/**
 * Hook to track anonymous user requests and rate limiting
 *
 * @param limit - Optional custom daily limit (defaults to DAILY_LIMIT)
 * @returns Tracking information and control functions
 */
export function useAnonymousTracking(
  limit: number = DAILY_LIMIT,
): UseAnonymousTrackingReturn {
  const [trackingData, setTrackingData] = useState<TrackingData>(() =>
    getTrackingData(),
  );
  const [mounted, setMounted] = useState(false);

  // Initialize on client-side mount
  useEffect(() => {
    setMounted(true);
    // Clean up old data on mount
    cleanupOldData();
    // Update tracking data from localStorage
    setTrackingData(getTrackingData());
  }, []);

  const resetDate = getTodayString();
  const requestsRemaining = Math.max(0, limit - trackingData.count);
  const isLimitReached = requestsRemaining <= 0;
  const resetAt = trackingData.resetAt ? new Date(trackingData.resetAt) : null;

  /**
   * Increment request count and save to localStorage
   */
  const incrementRequest = useCallback(() => {
    setTrackingData((prevData) => {
      const newData: TrackingData = {
        ...prevData,
        count: prevData.count + 1,
        resetAt: prevData.resetAt || getTomorrowMidnight(),
      };
      saveTrackingData(newData);
      return newData;
    });
  }, []);

  return {
    requestsRemaining: mounted ? requestsRemaining : limit,
    requestsLimit: limit,
    resetAt,
    incrementRequest,
    isLimitReached: mounted ? isLimitReached : false,
    resetDate,
  };
}

/**
 * Synchronize local tracking with backend rate limit headers
 * Call this after receiving an API response
 *
 * @param remaining - Value from X-RateLimit-Remaining header
 * @param limit - Value from X-RateLimit-Limit header
 * @param reset - Value from X-RateLimit-Reset header (ISO date string)
 */
export function syncTrackingWithHeaders(
  remaining?: string,
  limit?: string,
  reset?: string,
): void {
  if (!remaining || !limit) {
    return;
  }

  try {
    const remainingNum = parseInt(remaining, 10);
    const limitNum = parseInt(limit, 10);

    const data: TrackingData = {
      count: limitNum - remainingNum,
      resetAt: reset || getTomorrowMidnight(),
    };

    saveTrackingData(data);
  } catch (error) {
    console.error("Error syncing tracking with headers:", error);
  }
}

/**
 * Reset tracking data (useful for testing or manual reset)
 */
export function resetTrackingData(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const today = getTodayString();
    const key = `${STORAGE_PREFIX}_${today}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error resetting tracking data:", error);
  }
}
