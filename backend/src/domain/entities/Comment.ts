/**
 * Comment Entity
 * Represents a user comment with sentiment analysis
 */

export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface CommentProps {
  id: string;
  videoId: string;
  authorName: string;
  content: string;
  likeCount: number;
  publishedAt?: Date;
  sentimentScore?: number;
  sentiment?: SentimentType;
  positiveWords?: string[];
  negativeWords?: string[];
}

export class Comment {
  private constructor(
    public readonly id: string,
    public readonly videoId: string,
    public readonly authorName: string,
    public readonly content: string,
    public readonly likeCount: number,
    public readonly publishedAt?: Date,
    public readonly sentimentScore?: number,
    public readonly sentiment?: SentimentType,
    public readonly positiveWords?: string[],
    public readonly negativeWords?: string[]
  ) {}

  /**
   * Create a new Comment entity
   */
  static create(props: CommentProps): Comment {
    return new Comment(
      props.id,
      props.videoId,
      props.authorName,
      props.content,
      props.likeCount,
      props.publishedAt,
      props.sentimentScore,
      props.sentiment,
      props.positiveWords,
      props.negativeWords
    );
  }

  /**
   * Create comment with sentiment analysis results
   */
  static createWithSentiment(
    props: CommentProps,
    sentimentScore: number,
    sentiment: SentimentType,
    positiveWords?: string[],
    negativeWords?: string[]
  ): Comment {
    return new Comment(
      props.id,
      props.videoId,
      props.authorName,
      props.content,
      props.likeCount,
      props.publishedAt,
      sentimentScore,
      sentiment,
      positiveWords,
      negativeWords
    );
  }

  /**
   * Check if comment is positive
   */
  isPositive(): boolean {
    return this.sentiment === 'POSITIVE';
  }

  /**
   * Check if comment is negative
   */
  isNegative(): boolean {
    return this.sentiment === 'NEGATIVE';
  }

  /**
   * Check if comment is highly engaged (>10 likes)
   */
  isHighlyEngaged(): boolean {
    return this.likeCount >= 10;
  }

  /**
   * Get comment preview (first 100 characters)
   */
  getPreview(maxLength: number = 100): string {
    if (this.content.length <= maxLength) return this.content;
    return this.content.substring(0, maxLength) + '...';
  }

  /**
   * Get weighted sentiment score (factoring in likes)
   */
  getWeightedSentiment(): number {
    if (!this.sentimentScore) return 0;
    const weight = 1 + Math.log(1 + this.likeCount);
    return this.sentimentScore * weight;
  }
}
