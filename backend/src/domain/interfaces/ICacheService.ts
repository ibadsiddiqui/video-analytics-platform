/**
 * Cache Service Interface
 * Defines contract for caching operations
 */
export interface ICacheService {
  /**
   * Retrieve cached data by key
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store data in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in seconds (optional)
   * @returns Success status
   */
  set<T>(key: string, data: T, ttl?: number): Promise<boolean>;

  /**
   * Delete cached data
   * @param key - Cache key
   * @returns Success status
   */
  delete(key: string): Promise<boolean>;

  /**
   * Generate cache key for video analytics
   * @param platform - Video platform
   * @param videoId - Video identifier
   * @returns Generated cache key
   */
  getVideoKey(platform: string, videoId: string): string;

  /**
   * Get analytics history for a video
   * @param videoId - Video identifier
   * @param days - Number of days to retrieve
   * @returns Array of historical analytics snapshots
   */
  getAnalyticsHistory(videoId: string, days: number): Promise<any[]>;

  /**
   * Add analytics snapshot to history
   * @param videoId - Video identifier
   * @param snapshot - Analytics snapshot data
   * @returns Success status
   */
  addToHistory(videoId: string, snapshot: any): Promise<boolean>;

  /**
   * Check if cache service is enabled/available
   */
  isEnabled(): boolean;
}
