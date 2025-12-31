/**
 * SentimentAnalysis Value Object
 * Immutable value object representing sentiment analysis results
 */

export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface SentimentDistribution {
  positive: number; // percentage
  neutral: number; // percentage
  negative: number; // percentage
}

export interface SentimentAnalysisProps {
  overallScore: number;
  overallSentiment: SentimentType;
  distribution: SentimentDistribution;
  totalAnalyzed: number;
}

export class SentimentAnalysis {
  private constructor(
    public readonly overallScore: number,
    public readonly overallSentiment: SentimentType,
    public readonly distribution: SentimentDistribution,
    public readonly totalAnalyzed: number
  ) {}

  /**
   * Create new SentimentAnalysis value object
   */
  static create(props: SentimentAnalysisProps): SentimentAnalysis {
    return new SentimentAnalysis(
      props.overallScore,
      props.overallSentiment,
      props.distribution,
      props.totalAnalyzed
    );
  }

  /**
   * Create from raw sentiment scores
   */
  static fromScores(
    positiveCount: number,
    neutralCount: number,
    negativeCount: number,
    weightedScore: number
  ): SentimentAnalysis {
    const total = positiveCount + neutralCount + negativeCount;

    if (total === 0) {
      return new SentimentAnalysis(
        0,
        'NEUTRAL',
        { positive: 0, neutral: 100, negative: 0 },
        0
      );
    }

    const distribution: SentimentDistribution = {
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
    };

    const sentiment = this.determineSentiment(weightedScore);

    return new SentimentAnalysis(
      parseFloat(weightedScore.toFixed(4)),
      sentiment,
      distribution,
      total
    );
  }

  /**
   * Determine sentiment type from score
   */
  private static determineSentiment(score: number): SentimentType {
    if (score > 0.1) return 'POSITIVE';
    if (score < -0.1) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * Check if sentiment is overwhelmingly positive (>70%)
   */
  isOverwhelminglyPositive(): boolean {
    return this.distribution.positive >= 70;
  }

  /**
   * Check if sentiment is overwhelmingly negative (>70%)
   */
  isOverwhelminglyNegative(): boolean {
    return this.distribution.negative >= 70;
  }

  /**
   * Check if sentiment is mixed/controversial (all within 20-45%)
   */
  isMixed(): boolean {
    return (
      this.distribution.positive >= 20 &&
      this.distribution.positive <= 45 &&
      this.distribution.negative >= 20 &&
      this.distribution.negative <= 45
    );
  }

  /**
   * Get dominant sentiment category
   */
  getDominantSentiment(): SentimentType {
    const { positive, neutral, negative } = this.distribution;
    const max = Math.max(positive, neutral, negative);

    if (max === positive) return 'POSITIVE';
    if (max === negative) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * Get sentiment confidence score (0-100)
   */
  getConfidence(): number {
    const max = Math.max(
      this.distribution.positive,
      this.distribution.neutral,
      this.distribution.negative
    );
    return max;
  }

  /**
   * Get formatted overall score
   */
  getFormattedScore(): string {
    return this.overallScore.toFixed(2);
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      overall: {
        score: this.overallScore,
        sentiment: this.overallSentiment,
      },
      distribution: this.distribution,
      totalAnalyzed: this.totalAnalyzed,
      confidence: this.getConfidence(),
      dominantSentiment: this.getDominantSentiment(),
    };
  }
}
