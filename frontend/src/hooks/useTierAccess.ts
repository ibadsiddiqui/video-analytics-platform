"use client";

import { useUserProfile } from "./useUserProfile";
import { TIER_FEATURES, hasFeatureAccess } from "@/lib/constants/tiers";
import { UserTier } from "@prisma/client";

export function useTierAccess() {
  const { profile, loading } = useUserProfile();

  const userTier = profile?.tier as UserTier | undefined;

  const checkAccess = (feature: keyof typeof TIER_FEATURES): boolean => {
    return hasFeatureAccess(userTier, feature);
  };

  return {
    userTier,
    loading,
    hasAccess: checkAccess,
    // Specific feature checks
    canManageApiKeys: checkAccess("API_KEY_MANAGEMENT"),
    canTrackCompetitors: checkAccess("COMPETITOR_TRACKING"),
    canUseBenchmarks: checkAccess("BENCHMARK_COMPARISONS"),
    // Phase 3 features
    canUseViralScore: checkAccess("VIRAL_SCORE"),
    canUsePostingTimeOptimizer: checkAccess("POSTING_TIME_OPTIMIZER"),
    // Phase 4 features
    canUseTitleAnalysis: checkAccess("TITLE_ANALYSIS"),
    canUseThumbnailAnalysis: checkAccess("THUMBNAIL_ANALYSIS"),
    // Phase 5 features
    canUseAudienceAnalytics: checkAccess("AUDIENCE_ANALYTICS"),
  };
}
