/**
 * Video History Response DTO
 * Response for video history endpoint
 */

export class HistorySnapshotDTO {
  timestamp!: string;
  views!: number;
  likes!: number;
  comments!: number;
}

export class HistorySummaryDTO {
  totalSnapshots!: number;
  oldestSnapshot?: string;
  newestSnapshot?: string;
  viewsGrowth?: number;
  likesGrowth?: number;
  commentsGrowth?: number;
}

export class VideoHistoryResponse {
  videoId!: string;
  snapshots!: HistorySnapshotDTO[];
  summary!: HistorySummaryDTO;
}
