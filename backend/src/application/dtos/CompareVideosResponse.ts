/**
 * Compare Videos Response DTO
 * Response for video comparison endpoint
 */

import { VideoAnalyticsResponse } from './VideoAnalyticsResponse';

export class ComparisonMetricDTO {
  highest!: number;
  lowest!: number;
  average!: number;
  winner!: string;
}

export class ComparisonDataDTO {
  views!: ComparisonMetricDTO;
  likes!: ComparisonMetricDTO;
  comments!: ComparisonMetricDTO;
  engagementRate!: ComparisonMetricDTO;
}

export class ComparisonSummaryDTO {
  totalVideos!: number;
  successfulFetches!: number;
  failedFetches!: number;
}

export class VideoErrorDTO {
  error!: string;
  url!: string;
}

export class CompareVideosResponse {
  videos!: Array<VideoAnalyticsResponse | VideoErrorDTO>;
  comparison!: ComparisonDataDTO | null;
  summary!: ComparisonSummaryDTO;
}
