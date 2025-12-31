/**
 * Video Analytics Response DTO
 * Response for video analytics endpoint
 */

export class VideoInfoDTO {
  platform!: string;
  id!: string;
  url!: string;
  title!: string;
  description?: string;
  thumbnail?: string;
  publishedAt?: string;
  duration?: number;
  durationFormatted!: string;
}

export class ChannelInfoDTO {
  name!: string;
  id!: string;
  thumbnail?: string;
  subscribers?: number;
  subscribersFormatted!: string;
}

export class MetricsDTO {
  views!: number;
  viewsFormatted!: string;
  likes!: number;
  likesFormatted!: string;
  comments!: number;
  commentsFormatted!: string;
  shares!: number;
  sharesFormatted!: string;
  engagementRate!: number;
  engagementRateFormatted!: string;
}

export class EngagementByDayDTO {
  day!: string;
  engagement!: number;
  views!: number;
}

export class EngagementDTO {
  byDay!: EngagementByDayDTO[];
  peakDay!: EngagementByDayDTO | null;
}

export class SentimentDTO {
  overall!: {
    score: number;
    sentiment: string;
  };
  distribution!: {
    positive: number;
    neutral: number;
    negative: number;
  };
  totalAnalyzed!: number;
}

export class KeywordDTO {
  keyword!: string;
  score!: number;
}

export class HashtagDTO {
  hashtag!: string;
  count!: number;
}

export class AgeDistributionDTO {
  range!: string;
  percentage!: number;
}

export class DemographicsDTO {
  ageDistribution!: AgeDistributionDTO[];
  genderSplit!: {
    male: number;
    female: number;
  };
}

export class CommentDTO {
  id!: string;
  authorName!: string;
  content!: string;
  likeCount!: number;
  sentiment?: string;
  sentimentScore?: number;
}

export class MetadataDTO {
  fetchedAt!: string;
  fromCache!: boolean;
  platform!: string;
}

export class VideoAnalyticsResponse {
  video!: VideoInfoDTO;
  channel!: ChannelInfoDTO;
  metrics!: MetricsDTO;
  engagement!: EngagementDTO;
  sentiment!: SentimentDTO | null;
  keywords!: KeywordDTO[];
  hashtags!: HashtagDTO[];
  demographics!: DemographicsDTO;
  topComments!: CommentDTO[];
  meta!: MetadataDTO;
}
