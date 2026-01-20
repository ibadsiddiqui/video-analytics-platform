/**
 * Competitor Tracking Service
 * Manages competitor channel tracking and metrics updates
 * Phase 2.1: Competitor Tracking
 */

import { prisma } from "@/lib/prisma";
import { Platform, VideoNiche } from "@prisma/client";
import NicheDetector from "./niche-detector";

export interface CompetitorMetrics {
  subscriberCount: bigint;
  videoCount: number;
  totalViews: bigint;
  avgEngagement: number | null;
}

export interface CompetitorData {
  id: string;
  channelName: string;
  channelUrl: string;
  niche: VideoNiche;
  metrics: CompetitorMetrics;
  firstTrackedAt: Date;
  lastCheckedAt: Date | null;
  isActive: boolean;
}

export class CompetitorService {
  /**
   * Add a competitor channel for tracking
   */
  static async addCompetitor(
    userId: string,
    platform: Platform,
    channelId: string,
    channelName: string,
    channelUrl: string,
    thumbnailUrl?: string,
  ): Promise<CompetitorData | null> {
    try {
      // Fetch channel metrics from YouTube API
      const metrics = await this.fetchChannelMetrics(platform, channelId);
      if (!metrics) {
        throw new Error("Failed to fetch channel metrics");
      }

      // Detect niche from channel info
      const niche = NicheDetector.detect(channelName, "", "");

      // Check if competitor already exists
      const existing = await prisma.competitorTrack.findFirst({
        where: {
          userId,
          platform,
          channelId,
        },
      });

      if (existing) {
        // Re-activate if previously deactivated
        if (!existing.isActive) {
          const updated = await prisma.competitorTrack.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              lastCheckedAt: new Date(),
            },
          });
          return this.formatCompetitorData(updated, metrics);
        }
        throw new Error("Competitor already being tracked");
      }

      // Create new competitor track
      const competitor = await prisma.competitorTrack.create({
        data: {
          userId,
          platform,
          channelId,
          channelName,
          channelUrl,
          thumbnailUrl,
          niche,
          subscriberCount: metrics.subscriberCount,
          videoCount: metrics.videoCount,
          totalViews: metrics.totalViews,
          avgEngagement: metrics.avgEngagement,
          lastCheckedAt: new Date(),
        },
      });

      // Create initial snapshot
      await prisma.competitorSnapshot.create({
        data: {
          competitorId: competitor.id,
          subscriberCount: metrics.subscriberCount,
          videoCount: metrics.videoCount,
          totalViews: metrics.totalViews,
          avgEngagement: metrics.avgEngagement,
        },
      });

      return this.formatCompetitorData(competitor, metrics);
    } catch (error) {
      console.error("Error adding competitor:", error);
      throw error;
    }
  }

  /**
   * Remove competitor from tracking
   */
  static async removeCompetitor(
    userId: string,
    competitorId: string,
  ): Promise<boolean> {
    try {
      const competitor = await prisma.competitorTrack.findFirst({
        where: {
          id: competitorId,
          userId, // Ensure user owns this competitor
        },
      });

      if (!competitor) {
        throw new Error("Competitor not found");
      }

      // Soft delete by deactivating
      await prisma.competitorTrack.update({
        where: { id: competitorId },
        data: { isActive: false },
      });

      return true;
    } catch (error) {
      console.error("Error removing competitor:", error);
      throw error;
    }
  }

  /**
   * Get all competitors for a user
   */
  static async getCompetitors(userId: string): Promise<CompetitorData[]> {
    try {
      const competitors = await prisma.competitorTrack.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: { lastCheckedAt: "desc" },
      });

      return competitors.map((comp) => ({
        id: comp.id,
        channelName: comp.channelName,
        channelUrl: comp.channelUrl,
        niche: comp.niche,
        metrics: {
          subscriberCount: comp.subscriberCount,
          videoCount: comp.videoCount,
          totalViews: comp.totalViews,
          avgEngagement: comp.avgEngagement,
        },
        firstTrackedAt: comp.firstTrackedAt,
        lastCheckedAt: comp.lastCheckedAt,
        isActive: comp.isActive,
      }));
    } catch (error) {
      console.error("Error fetching competitors:", error);
      throw error;
    }
  }

  /**
   * Get single competitor with history
   */
  static async getCompetitorWithHistory(
    userId: string,
    competitorId: string,
    days: number = 30,
  ) {
    try {
      const competitor = await prisma.competitorTrack.findFirst({
        where: {
          id: competitorId,
          userId,
        },
      });

      if (!competitor) {
        throw new Error("Competitor not found");
      }

      // Fetch historical snapshots
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshots = await prisma.competitorSnapshot.findMany({
        where: {
          competitorId,
          recordedAt: {
            gte: cutoffDate,
          },
        },
        orderBy: { recordedAt: "asc" },
      });

      return {
        id: competitor.id,
        channelName: competitor.channelName,
        channelUrl: competitor.channelUrl,
        niche: competitor.niche,
        currentMetrics: {
          subscriberCount: competitor.subscriberCount,
          videoCount: competitor.videoCount,
          totalViews: competitor.totalViews,
          avgEngagement: competitor.avgEngagement,
        },
        history: snapshots.map((snap) => ({
          date: snap.recordedAt,
          subscriberCount: snap.subscriberCount,
          videoCount: snap.videoCount,
          totalViews: snap.totalViews,
          avgEngagement: snap.avgEngagement,
        })),
        firstTrackedAt: competitor.firstTrackedAt,
        lastCheckedAt: competitor.lastCheckedAt,
      };
    } catch (error) {
      console.error("Error fetching competitor history:", error);
      throw error;
    }
  }

  /**
   * Update competitor metrics (called by cron job)
   */
  static async updateCompetitorMetrics(competitorId: string): Promise<boolean> {
    try {
      const competitor = await prisma.competitorTrack.findUnique({
        where: { id: competitorId },
      });

      if (!competitor || !competitor.isActive) {
        return false;
      }

      // Fetch fresh metrics
      const metrics = await this.fetchChannelMetrics(
        competitor.platform,
        competitor.channelId,
      );
      if (!metrics) {
        return false;
      }

      // Update competitor
      await prisma.competitorTrack.update({
        where: { id: competitorId },
        data: {
          subscriberCount: metrics.subscriberCount,
          videoCount: metrics.videoCount,
          totalViews: metrics.totalViews,
          avgEngagement: metrics.avgEngagement,
          lastCheckedAt: new Date(),
          lastFetchedAt: new Date(),
        },
      });

      // Create snapshot for historical tracking
      await prisma.competitorSnapshot.create({
        data: {
          competitorId,
          subscriberCount: metrics.subscriberCount,
          videoCount: metrics.videoCount,
          totalViews: metrics.totalViews,
          avgEngagement: metrics.avgEngagement,
        },
      });

      return true;
    } catch (error) {
      console.error("Error updating competitor metrics:", error);
      return false;
    }
  }

  /**
   * Update all active competitors for a user
   */
  static async updateUserCompetitors(userId: string): Promise<number> {
    try {
      const competitors = await prisma.competitorTrack.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      let updated = 0;
      for (const competitor of competitors) {
        const success = await this.updateCompetitorMetrics(competitor.id);
        if (success) updated++;
      }

      return updated;
    } catch (error) {
      console.error("Error batch updating competitors:", error);
      return 0;
    }
  }

  /**
   * Fetch channel metrics from YouTube API
   */
  private static async fetchChannelMetrics(
    platform: Platform,
    channelId: string,
  ): Promise<CompetitorMetrics | null> {
    try {
      if (platform !== "YOUTUBE") {
        // TODO: Add Instagram support via RapidAPI
        console.warn(
          "Non-YouTube platforms not yet supported for competitor tracking",
        );
        return null;
      }

      // Use YouTube API to fetch channel stats
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error("YouTube API key not configured");
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch YouTube channel data");
      }

      const data = (await response.json()) as {
        items?: Array<{
          statistics?: {
            subscriberCount?: string;
            videoCount?: string;
            viewCount?: string;
          };
        }>;
      };

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const stats = data.items[0].statistics;
      if (!stats) {
        return null;
      }

      const subscriberCount = BigInt(stats.subscriberCount || "0");
      const videoCount = parseInt(stats.videoCount || "0", 10);
      const totalViews = BigInt(stats.viewCount || "0");

      // Calculate average engagement (simple estimate based on available data)
      const avgEngagement =
        videoCount > 0 ? Number(totalViews) / videoCount / 1000 : 0;

      return {
        subscriberCount,
        videoCount,
        totalViews,
        avgEngagement,
      };
    } catch (error) {
      console.error("Error fetching channel metrics:", error);
      return null;
    }
  }

  /**
   * Format competitor data for API response
   */
  private static formatCompetitorData(
    competitor: any,
    metrics: CompetitorMetrics,
  ): CompetitorData {
    return {
      id: competitor.id,
      channelName: competitor.channelName,
      channelUrl: competitor.channelUrl,
      niche: competitor.niche,
      metrics: {
        subscriberCount: metrics.subscriberCount,
        videoCount: metrics.videoCount,
        totalViews: metrics.totalViews,
        avgEngagement: metrics.avgEngagement,
      },
      firstTrackedAt: competitor.firstTrackedAt,
      lastCheckedAt: competitor.lastCheckedAt,
      isActive: competitor.isActive,
    };
  }
}

export default CompetitorService;
