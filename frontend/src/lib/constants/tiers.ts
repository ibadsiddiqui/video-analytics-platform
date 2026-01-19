import { UserTier } from '@prisma/client';

// Tier feature access configuration
export const TIER_FEATURES = {
  // Phase 1.2: API Key Management
  API_KEY_MANAGEMENT: ['CREATOR', 'PRO', 'AGENCY'] as UserTier[],

  // Phase 2.1: Competitor Tracking
  COMPETITOR_TRACKING: ['PRO', 'AGENCY'] as UserTier[],

  // Phase 2.2: Benchmark Comparisons
  BENCHMARK_COMPARISONS: ['PRO', 'AGENCY'] as UserTier[],

  // Phase 3.1: Viral Potential Score
  VIRAL_SCORE: ['PRO', 'AGENCY'] as UserTier[],

  // Phase 3.2: Optimal Posting Time
  POSTING_TIME_OPTIMIZER: ['PRO', 'AGENCY'] as UserTier[],

  // Future features
  EXPORT_PDF: ['PRO', 'AGENCY'] as UserTier[],
} as const;

// Tier display configuration
export const TIER_CONFIG = {
  FREE: {
    name: 'Free',
    dailyLimit: 100,
    commentLimit: 10,
    features: ['Basic video analysis', 'Sentiment analysis', 'Top 10 comments', '100 analyses/day'],
    color: 'slate',
    badge: 'Free',
  },
  CREATOR: {
    name: 'Creator',
    dailyLimit: 100,
    commentLimit: 50,
    features: ['All Free features', 'API key management', 'Top 50 comments', '100 analyses/day'],
    color: 'blue',
    badge: 'Creator',
  },
  PRO: {
    name: 'Pro',
    dailyLimit: 500,
    commentLimit: -1, // -1 means unlimited
    features: ['All Creator features', 'Competitor tracking', 'Benchmark comparisons', 'Viral potential score', 'Optimal posting times', 'Unlimited comments', '500 analyses/day'],
    color: 'amber',
    badge: 'Pro',
  },
  AGENCY: {
    name: 'Agency',
    dailyLimit: 2000,
    commentLimit: -1, // -1 means unlimited
    features: ['All Pro features', 'Unlimited competitors', 'Priority support', 'Unlimited comments', '2,000 analyses/day'],
    color: 'purple',
    badge: 'Agency',
  },
} as const;

// Get comment limit for a tier (-1 means unlimited)
export function getCommentLimit(tier: UserTier | undefined): number {
  if (!tier) return TIER_CONFIG.FREE.commentLimit;
  return TIER_CONFIG[tier]?.commentLimit ?? TIER_CONFIG.FREE.commentLimit;
}

// Helper function to check tier access
export function hasFeatureAccess(userTier: UserTier | undefined, feature: keyof typeof TIER_FEATURES): boolean {
  if (!userTier) return false;
  return TIER_FEATURES[feature].includes(userTier);
}

// Get minimum tier required for a feature
export function getMinimumTier(feature: keyof typeof TIER_FEATURES): UserTier {
  return TIER_FEATURES[feature][0];
}
