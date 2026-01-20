/**
 * Audience Overlap Analysis Service
 * Phase 5.1: Audience Analytics
 *
 * Analyzes comment patterns to identify channels with shared audiences.
 * Provides collaboration opportunities based on audience overlap.
 */

import { prisma } from "@/lib/prisma";

export interface ChannelOverlap {
  channelId: string;
  channelName: string;
  platform: string;
  overlapScore: number; // 0-100 percentage of overlap
  sharedCommenters: number;
  totalCommenters: number;
  sampleCommenters: string[]; // Sample of usernames that overlap
  collaborationPotential: "high" | "medium" | "low";
}

export interface AudienceOverlapResult {
  baseChannel: {
    channelId: string;
    channelName: string;
    totalCommenters: number;
  };
  overlappingChannels: ChannelOverlap[];
  insights: string[];
  topCollaborationOpportunities: ChannelOverlap[];
}

export interface Superfan {
  username: string;
  platform: string;
  totalComments: number;
  totalLikes: number;
  avgSentiment: number; // -1 to 1
  firstSeenAt: Date;
  lastSeenAt: Date;
  engagementScore: number; // 0-100
  isActive: boolean; // Active in last 30 days
}

export interface SuperfanAnalysisResult {
  channelId: string;
  superfans: Superfan[];
  totalUniqueCommenters: number;
  superfanPercentage: number;
  insights: string[];
}

export class AudienceAnalyzer {
  /**
   * Analyze audience overlap between a channel and others
   */
  static async analyzeOverlap(
    channelId: string,
    platform: string = "YOUTUBE",
    limit: number = 10,
  ): Promise<AudienceOverlapResult> {
    // Get all videos from the base channel
    const baseVideos = await prisma.video.findMany({
      where: {
        channelId,
        platform: platform as "YOUTUBE" | "INSTAGRAM" | "VIMEO" | "OTHER",
      },
      select: {
        id: true,
        channelName: true,
        comments: {
          select: {
            authorName: true,
          },
          where: {
            authorName: { not: null },
          },
        },
      },
    });

    if (baseVideos.length === 0) {
      return {
        baseChannel: {
          channelId,
          channelName: "Unknown",
          totalCommenters: 0,
        },
        overlappingChannels: [],
        insights: ["No videos found for this channel"],
        topCollaborationOpportunities: [],
      };
    }

    // Extract unique commenters from base channel
    const baseCommenters = new Set<string>();
    baseVideos.forEach((video) => {
      video.comments.forEach((comment) => {
        if (comment.authorName) {
          baseCommenters.add(comment.authorName.toLowerCase());
        }
      });
    });

    const channelName = baseVideos[0]?.channelName || "Unknown";

    if (baseCommenters.size === 0) {
      return {
        baseChannel: {
          channelId,
          channelName,
          totalCommenters: 0,
        },
        overlappingChannels: [],
        insights: ["No commenters found for this channel"],
        topCollaborationOpportunities: [],
      };
    }

    // Get all other channels' videos with comments
    const otherVideos = await prisma.video.findMany({
      where: {
        channelId: { not: channelId },
        platform: platform as "YOUTUBE" | "INSTAGRAM" | "VIMEO" | "OTHER",
      },
      select: {
        channelId: true,
        channelName: true,
        comments: {
          select: {
            authorName: true,
          },
          where: {
            authorName: { not: null },
          },
        },
      },
    });

    // Group by channel and count overlap
    const channelCommenters = new Map<
      string,
      {
        channelName: string;
        commenters: Set<string>;
      }
    >();

    otherVideos.forEach((video) => {
      if (!video.channelId) return;

      if (!channelCommenters.has(video.channelId)) {
        channelCommenters.set(video.channelId, {
          channelName: video.channelName || "Unknown",
          commenters: new Set(),
        });
      }

      video.comments.forEach((comment) => {
        if (comment.authorName) {
          channelCommenters
            .get(video.channelId!)!
            .commenters.add(comment.authorName.toLowerCase());
        }
      });
    });

    // Calculate overlap for each channel
    const overlappingChannels: ChannelOverlap[] = [];

    for (const [otherChannelId, data] of channelCommenters.entries()) {
      const sharedCommenters = new Set(
        [...data.commenters].filter((c) => baseCommenters.has(c)),
      );

      if (sharedCommenters.size === 0) continue;

      const overlapScore = Math.round(
        (sharedCommenters.size / baseCommenters.size) * 100,
      );

      overlappingChannels.push({
        channelId: otherChannelId,
        channelName: data.channelName,
        platform,
        overlapScore,
        sharedCommenters: sharedCommenters.size,
        totalCommenters: data.commenters.size,
        sampleCommenters: [...sharedCommenters].slice(0, 5),
        collaborationPotential: this.calculateCollaborationPotential(
          overlapScore,
          sharedCommenters.size,
        ),
      });
    }

    // Sort by overlap score
    overlappingChannels.sort((a, b) => b.overlapScore - a.overlapScore);

    // Get top collaboration opportunities (high overlap but not too much)
    const topOpportunities = overlappingChannels
      .filter(
        (c) =>
          c.overlapScore >= 5 &&
          c.overlapScore <= 50 &&
          c.sharedCommenters >= 3,
      )
      .slice(0, 5);

    // Generate insights
    const insights = this.generateOverlapInsights(
      overlappingChannels,
      baseCommenters.size,
    );

    return {
      baseChannel: {
        channelId,
        channelName,
        totalCommenters: baseCommenters.size,
      },
      overlappingChannels: overlappingChannels.slice(0, limit),
      insights,
      topCollaborationOpportunities: topOpportunities,
    };
  }

  /**
   * Calculate collaboration potential based on overlap metrics
   */
  private static calculateCollaborationPotential(
    overlapScore: number,
    sharedCommenters: number,
  ): "high" | "medium" | "low" {
    // Ideal overlap: 10-30% (enough shared audience but not complete overlap)
    if (overlapScore >= 10 && overlapScore <= 30 && sharedCommenters >= 10) {
      return "high";
    }
    if (overlapScore >= 5 && overlapScore <= 50 && sharedCommenters >= 5) {
      return "medium";
    }
    return "low";
  }

  /**
   * Generate insights from overlap analysis
   */
  private static generateOverlapInsights(
    overlappingChannels: ChannelOverlap[],
    totalBaseCommenters: number,
  ): string[] {
    const insights: string[] = [];

    if (overlappingChannels.length === 0) {
      insights.push(
        "No audience overlap detected with other channels in our database",
      );
      insights.push("This could indicate a unique niche or limited data");
      return insights;
    }

    // High overlap insight
    const highOverlap = overlappingChannels.filter((c) => c.overlapScore > 30);
    if (highOverlap.length > 0) {
      insights.push(
        `${highOverlap.length} channel(s) have >30% audience overlap - consider differentiation strategies`,
      );
    }

    // Collaboration opportunity insight
    const collaborationReady = overlappingChannels.filter(
      (c) => c.collaborationPotential === "high",
    );
    if (collaborationReady.length > 0) {
      insights.push(
        `${collaborationReady.length} channel(s) are ideal collaboration partners (10-30% shared audience)`,
      );
    }

    // Total reach insight
    const totalReachableAudience = overlappingChannels.reduce(
      (sum, c) => sum + c.totalCommenters - c.sharedCommenters,
      0,
    );
    if (totalReachableAudience > 0) {
      insights.push(
        `Collaboration potential: Reach ${totalReachableAudience.toLocaleString()} new viewers through partner channels`,
      );
    }

    // Niche similarity insight
    if (overlappingChannels.length >= 5) {
      const avgOverlap =
        overlappingChannels
          .slice(0, 5)
          .reduce((s, c) => s + c.overlapScore, 0) / 5;
      if (avgOverlap > 15) {
        insights.push(
          "Strong niche community - your audience is actively engaged across similar channels",
        );
      }
    }

    return insights.slice(0, 4);
  }

  /**
   * Identify superfans (highly engaged community members)
   */
  static async identifySuperfans(
    channelId: string,
    platform: string = "YOUTUBE",
    minComments: number = 3,
  ): Promise<SuperfanAnalysisResult> {
    // Get all comments for this channel's videos
    const videos = await prisma.video.findMany({
      where: {
        channelId,
        platform: platform as "YOUTUBE" | "INSTAGRAM" | "VIMEO" | "OTHER",
      },
      select: {
        id: true,
        comments: {
          select: {
            authorName: true,
            content: true,
            likeCount: true,
            sentiment: true,
            sentimentScore: true,
            publishedAt: true,
            createdAt: true,
          },
          where: {
            authorName: { not: null },
          },
        },
      },
    });

    // Aggregate commenter data
    const commenterData = new Map<
      string,
      {
        comments: number;
        likes: number;
        sentimentSum: number;
        firstSeen: Date;
        lastSeen: Date;
      }
    >();

    videos.forEach((video) => {
      video.comments.forEach((comment) => {
        if (!comment.authorName) return;

        const username = comment.authorName.toLowerCase();
        const existing = commenterData.get(username);
        const commentDate = comment.publishedAt || comment.createdAt;

        // Map sentiment to score (-1 to 1)
        const sentimentScore =
          comment.sentimentScore ??
          (comment.sentiment === "POSITIVE"
            ? 0.5
            : comment.sentiment === "NEGATIVE"
              ? -0.5
              : 0);

        if (existing) {
          existing.comments += 1;
          existing.likes += comment.likeCount || 0;
          existing.sentimentSum += sentimentScore;
          if (commentDate < existing.firstSeen) {
            existing.firstSeen = commentDate;
          }
          if (commentDate > existing.lastSeen) {
            existing.lastSeen = commentDate;
          }
        } else {
          commenterData.set(username, {
            comments: 1,
            likes: comment.likeCount || 0,
            sentimentSum: sentimentScore,
            firstSeen: commentDate,
            lastSeen: commentDate,
          });
        }
      });
    });

    // Filter and score superfans
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const superfans: Superfan[] = [];

    for (const [username, data] of commenterData.entries()) {
      if (data.comments < minComments) continue;

      const avgSentiment = data.sentimentSum / data.comments;
      const isActive = data.lastSeen >= thirtyDaysAgo;

      // Calculate engagement score (0-100)
      // Factors: comment frequency, likes, sentiment, recency
      const engagementScore = this.calculateEngagementScore(
        data.comments,
        data.likes,
        avgSentiment,
        isActive,
      );

      superfans.push({
        username,
        platform,
        totalComments: data.comments,
        totalLikes: data.likes,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        firstSeenAt: data.firstSeen,
        lastSeenAt: data.lastSeen,
        engagementScore,
        isActive,
      });
    }

    // Sort by engagement score
    superfans.sort((a, b) => b.engagementScore - a.engagementScore);

    // Calculate stats
    const totalUniqueCommenters = commenterData.size;
    const superfanCount = superfans.length;
    const superfanPercentage =
      totalUniqueCommenters > 0
        ? Math.round((superfanCount / totalUniqueCommenters) * 100)
        : 0;

    // Generate insights
    const insights = this.generateSuperfanInsights(
      superfans,
      totalUniqueCommenters,
      superfanPercentage,
    );

    return {
      channelId,
      superfans: superfans.slice(0, 50), // Return top 50
      totalUniqueCommenters,
      superfanPercentage,
      insights,
    };
  }

  /**
   * Calculate engagement score for a commenter
   */
  private static calculateEngagementScore(
    comments: number,
    likes: number,
    avgSentiment: number,
    isActive: boolean,
  ): number {
    let score = 0;

    // Comment frequency (max 40 points)
    score += Math.min(40, comments * 5);

    // Likes received (max 20 points)
    score += Math.min(20, Math.sqrt(likes) * 2);

    // Positive sentiment (max 20 points)
    score += Math.max(0, (avgSentiment + 1) * 10); // -1 to 1 -> 0 to 20

    // Active status (20 points)
    if (isActive) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Generate insights from superfan analysis
   */
  private static generateSuperfanInsights(
    superfans: Superfan[],
    totalCommenters: number,
    superfanPercentage: number,
  ): string[] {
    const insights: string[] = [];

    if (superfans.length === 0) {
      insights.push(
        "No superfans identified yet - keep creating engaging content!",
      );
      return insights;
    }

    // Superfan percentage insight
    if (superfanPercentage >= 10) {
      insights.push(
        `${superfanPercentage}% of your commenters are superfans - you have a highly engaged community!`,
      );
    } else if (superfanPercentage >= 5) {
      insights.push(
        `${superfanPercentage}% superfan rate - good engagement, room to grow loyal followers`,
      );
    } else {
      insights.push(
        `${superfanPercentage}% superfan rate - focus on community building to increase loyalty`,
      );
    }

    // Active superfans insight
    const activeSuperfans = superfans.filter((s) => s.isActive).length;
    const activePercentage =
      superfans.length > 0
        ? Math.round((activeSuperfans / superfans.length) * 100)
        : 0;
    insights.push(
      `${activePercentage}% of superfans active in last 30 days (${activeSuperfans} of ${superfans.length})`,
    );

    // Top superfan insight
    if (superfans[0]) {
      insights.push(
        `Top superfan "${superfans[0].username}" has ${superfans[0].totalComments} comments`,
      );
    }

    // Sentiment insight
    const avgSuperfanSentiment =
      superfans.reduce((s, f) => s + f.avgSentiment, 0) / superfans.length;
    if (avgSuperfanSentiment > 0.3) {
      insights.push(
        "Superfans have highly positive sentiment - they love your content!",
      );
    } else if (avgSuperfanSentiment < -0.1) {
      insights.push(
        "Some superfans have mixed sentiment - consider engaging with their feedback",
      );
    }

    return insights.slice(0, 4);
  }
}

export default AudienceAnalyzer;
