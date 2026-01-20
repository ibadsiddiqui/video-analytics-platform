"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

export type UserTier = "FREE" | "CREATOR" | "PRO" | "AGENCY";

export interface UserProfile {
  email: string;
  tier: UserTier;
  dailyRequests: number;
  dailyLimit: number;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const API_URL = "/api";

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      // Map the nested response structure correctly
      // Use rateLimit.used (calculated from today's requests) instead of raw dailyRequests
      const profileData: UserProfile = {
        email: response.data.user.email,
        tier: response.data.user.tier,
        dailyRequests:
          response.data.rateLimit.used ?? response.data.user.dailyRequests,
        dailyLimit: response.data.rateLimit.limit,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        imageUrl: response.data.user.imageUrl,
      };

      setProfile(profileData);
    } catch (err: any) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.status === 401
          ? "Unauthorized. Please sign in again."
          : err.message || "Failed to fetch user profile"
        : err.message || "Failed to fetch user profile";

      setError(errorMessage);
      console.error("Error fetching user profile:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export default useUserProfile;
