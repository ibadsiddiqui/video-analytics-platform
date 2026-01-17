/**
 * Niche Detection Service
 * Analyzes video metadata to classify content into niches
 * Phase 2.1: Competitive Intelligence
 */

import { VideoNiche } from '@prisma/client';

type NicheKeywords = Record<VideoNiche, string[]>;

// Keyword mapping for niche detection
const NICHE_KEYWORDS: NicheKeywords = {
  GAMING: [
    'gaming', 'game', 'gameplay', 'walkthrough', 'speedrun', 'stream', 'esports',
    'minecraft', 'fortnite', 'valorant', 'rust', 'gta', 'call of duty', 'zelda',
    'pokemon', 'roblox', 'elden ring', 'dark souls'
  ],
  TECH: [
    'tech', 'technology', 'coding', 'programming', 'software', 'hardware', 'ai',
    'machine learning', 'web development', 'app development', 'tutorial', 'review',
    'gadget', 'startup', 'silicon valley', 'python', 'javascript', 'react', 'nodejs'
  ],
  BEAUTY: [
    'beauty', 'makeup', 'cosmetics', 'skincare', 'haul', 'tutorial', 'lookbook',
    'fashion', 'style', 'aesthetic', 'nail art', 'hair', 'wig', 'lip gloss', 'eyeshadow'
  ],
  VLOGS: [
    'vlog', 'day in my life', 'morning routine', 'evening routine', 'life', 'daily',
    'personal', 'lifestyle', 'slice of life', 'routine', 'storytime'
  ],
  EDUCATION: [
    'education', 'tutorial', 'course', 'learning', 'how to', 'guide', 'lessons',
    'school', 'university', 'study', 'tips', 'advice', 'educational', 'knowledge'
  ],
  MUSIC: [
    'music', 'song', 'cover', 'original', 'beat', 'remix', 'production', 'artist',
    'album', 'live', 'performance', 'concert', 'music video', 'freestyle', 'rap'
  ],
  SPORTS: [
    'sports', 'football', 'basketball', 'soccer', 'baseball', 'tennis', 'hockey',
    'golf', 'cricket', 'rugby', 'training', 'fitness', 'workout', 'gym', 'race'
  ],
  ENTERTAINMENT: [
    'entertainment', 'movie', 'show', 'reaction', 'comedy', 'funny', 'entertainment',
    'clip', 'sketch', 'skit', 'tv show', 'series', 'episode'
  ],
  COOKING: [
    'cooking', 'recipe', 'food', 'cook', 'bake', 'cuisine', 'kitchen', 'chef',
    'meal', 'dinner', 'lunch', 'breakfast', 'dessert', 'pizza', 'pasta'
  ],
  TRAVEL: [
    'travel', 'vlog', 'adventure', 'destination', 'trip', 'journey', 'explore',
    'tour', 'vacation', 'hotel', 'resort', 'backpacking', 'tourist', 'sightseeing'
  ],
  BUSINESS: [
    'business', 'entrepreneurship', 'startup', 'marketing', 'sales', 'management',
    'finance', 'investment', 'career', 'professional', 'corporate', 'consulting'
  ],
  HEALTH: [
    'health', 'fitness', 'wellness', 'diet', 'exercise', 'yoga', 'meditation',
    'mental health', 'nutrition', 'workout', 'therapy', 'healthy', 'motivation'
  ],
  OTHER: [] // Catch-all for unclassified content
};

export class NicheDetector {
  /**
   * Detect niche from video metadata
   * @param title Video title
   * @param description Video description
   * @param tags Video tags/keywords (comma-separated or array)
   * @returns Detected niche
   */
  static detect(
    title: string = '',
    description: string = '',
    tags: string | string[] = ''
  ): VideoNiche {
    // Combine all text for analysis
    const allText = `${title} ${description} ${typeof tags === 'string' ? tags : tags.join(' ')}`
      .toLowerCase();

    // Score each niche based on keyword matches
    const scores: Partial<Record<VideoNiche, number>> = {};

    for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
      if (niche === 'OTHER') continue;

      let score = 0;
      for (const keyword of keywords) {
        // Count occurrences of each keyword
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = allText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      scores[niche as VideoNiche] = score;
    }

    // Find niche with highest score
    let bestNiche: VideoNiche = 'OTHER';
    let bestScore = 0;

    for (const [niche, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestNiche = niche as VideoNiche;
      }
    }

    // If score is too low (< 2 matches), classify as OTHER
    if (bestScore < 2) {
      return 'OTHER';
    }

    return bestNiche;
  }

  /**
   * Get confidence score for niche classification (0-1)
   * @param title Video title
   * @param description Video description
   * @param tags Video tags/keywords
   * @returns Confidence score
   */
  static getConfidence(
    title: string = '',
    description: string = '',
    tags: string | string[] = ''
  ): number {
    const allText = `${title} ${description} ${typeof tags === 'string' ? tags : tags.join(' ')}`
      .toLowerCase();

    const detectedNiche = this.detect(title, description, tags);
    if (detectedNiche === 'OTHER') return 0.3; // Low confidence for OTHER

    const keywords = NICHE_KEYWORDS[detectedNiche];
    let matches = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const count = (allText.match(regex) || []).length;
      if (count > 0) matches++;
    }

    // Confidence: (matches / total keywords) capped at 1
    return Math.min(1, matches / keywords.length);
  }

  /**
   * Get all available niches
   */
  static getAllNiches(): VideoNiche[] {
    return Object.keys(NICHE_KEYWORDS) as VideoNiche[];
  }

  /**
   * Get keywords for a specific niche
   */
  static getKeywordsForNiche(niche: VideoNiche): string[] {
    return NICHE_KEYWORDS[niche] || [];
  }
}

export default NicheDetector;
