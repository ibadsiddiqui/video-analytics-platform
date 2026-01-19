import { UserTier } from '@prisma/client';

// Tier feature access configuration
export const TIER_FEATURES = {
  // Phase 1.2: API Key Management
  API_KEY_MANAGEMENT: ['CREATOR', 'PRO', 'AGENCY'] as UserTier[],

  // Phase 2.1: Competitor Tracking
  COMPETITOR_TRACKING: ['PRO', 'AGENCY'] as UserTier[],

  // Phase 2.2: Benchmark Comparisons
  BENCHMARK_COMPARISONS: ['PRO', 'AGENCY'] as UserTier[],

  // Future features
  VIRAL_SCORE: ['PRO', 'AGENCY'] as UserTier[],
  EXPORT_PDF: ['PRO', 'AGENCY'] as UserTier[],
} as const;

// Tier display configuration
export const TIER_CONFIG = {
  FREE: {
    name: 'Free',
    dailyLimit: 5,
    features: ['Basic video analysis', 'Sentiment analysis', 'Comment insights'],
    color: 'slate',
    badge: 'Free',
  },
  CREATOR: {
    name: 'Creator',
    dailyLimit: 100,
    features: ['All Free features', 'API key management', '100 analyses/day'],
    color: 'blue',
    badge: 'Creator',
  },
  PRO: {
    name: 'Pro',
    dailyLimit: 500,
    features: ['All Creator features', 'Competitor tracking', 'Benchmark comparisons', '500 analyses/day'],
    color: 'amber',
    badge: 'Pro',
  },
  AGENCY: {
    name: 'Agency',
    dailyLimit: 2000,
    features: ['All Pro features', 'Unlimited competitors', 'Priority support', '2,000 analyses/day'],
    color: 'purple',
    badge: 'Agency',
  },
} as const;

// Helper function to check tier access
export function hasFeatureAccess(userTier: UserTier | undefined, feature: keyof typeof TIER_FEATURES): boolean {
  if (!userTier) return false;
  return TIER_FEATURES[feature].includes(userTier);
}

// Get minimum tier required for a feature
export function getMinimumTier(feature: keyof typeof TIER_FEATURES): UserTier {
  return TIER_FEATURES[feature][0];
}
