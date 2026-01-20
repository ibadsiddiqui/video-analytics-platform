/**
 * Posting Time Optimizer Service
 * Analyzes historical posting patterns and recommends optimal posting times
 * Phase 3.2: Optimal Posting Time Recommendations
 */

import { prisma } from "@/lib/prisma";
import { cacheService } from "@/lib/redis";
import BenchmarkService from "./benchmark";

export interface PostingTimeSlot {
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  hourRange: string; // '2-4 PM'
  startHour: number; // 14
  endHour: number; // 16
  averageEngagementRate: number;
  videoCount: number;
  averageViews: number;
  averageLikes: number;
  confidence: "high" | "medium" | "low";
}

export interface HeatmapDataPoint {
  day: string;
  dayIndex: number;
  hour: number;
  engagement: number;
  views: number;
  videoCount: number;
}

export interface PostingTimeRecommendation {
  topSlots: PostingTimeSlot[];
  heatmapData: HeatmapDataPoint[];
  insights: string[];
  totalAnalyzed: number;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export class PostingTimeOptimizerService {
  /**
   * Analyze user's historical posting performance and recommend optimal times
   * Requires user to have analyzed multiple videos
   */
  static async recommendPostingTimes(
    userId: string,
    niche?: string,
  ): Promise<PostingTimeRecommendation | null> {
    try {
      // Check cache first (24-hour cache for this data)
      const cacheKey = `posting-times:${userId}:${niche || "all"}`;
      const cached =
        await cacheService.get<PostingTimeRecommendation>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get all user's analyzed videos
      // For now, we'll get all videos and filter by userId if available
      // Note: The Video model doesn't have userId yet, so we'll use a workaround
      const allVideos = await prisma.video.findMany({
        select: {
          id: true,
          publishedAt: true,
          engagementRate: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
        },
        // If userId is added to Video model in the future, add:
        // where: {
        //   userId,
        //   ...(niche && { niche }),
        // },
      });

      if (allVideos.length === 0) {
        return null;
      }

      // Group by day of week and hour
      const performanceBySlot = this.aggregateByTimeSlot(allVideos);

      // Rank time slots by engagement
      const rankedSlots = this.rankTimeSlots(performanceBySlot);

      // Generate heatmap data (7 days x 24 hours)
      const heatmapData = this.generateHeatmapData(performanceBySlot);

      // Extract top 3 slots
      const topSlots = rankedSlots.slice(0, 3);

      // Generate insights
      const insights = this.generatePostingInsights(topSlots, allVideos.length);

      const result: PostingTimeRecommendation = {
        topSlots,
        heatmapData,
        insights,
        totalAnalyzed: allVideos.length,
      };

      // Cache for 24 hours
      await cacheService.set(cacheKey, result, 86400);

      return result;
    } catch (error) {
      console.error("Error recommending posting times:", error);
      return null;
    }
  }

  /**
   * Group videos by day of week and 2-hour time slots
   */
  private static aggregateByTimeSlot(
    videos: Array<{
      publishedAt?: Date;
      engagementRate: number | null;
      viewCount: bigint;
      likeCount: bigint;
      commentCount: bigint;
    }>,
  ): Map<
    string,
    Array<{
      engagement: number;
      views: bigint;
      likes: bigint;
      comments: bigint;
    }>
  > {
    const slots = new Map<
      string,
      Array<{
        engagement: number;
        views: bigint;
        likes: bigint;
        comments: bigint;
      }>
    >();

    for (const video of videos) {
      if (!video.publishedAt) continue;

      const date = new Date(video.publishedAt);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = date.getHours();

      // Convert to Monday-start week (0 = Monday, 6 = Sunday)
      const dayOfWeek = dayIndex === 0 ? 6 : dayIndex - 1;
      const dayName = DAYS_OF_WEEK[dayOfWeek];

      // Group into 2-hour slots
      const slotHour = Math.floor(hour / 2) * 2;
      const slotKey = `${dayName}-${slotHour}`;

      if (!slots.has(slotKey)) {
        slots.set(slotKey, []);
      }

      slots.get(slotKey)!.push({
        engagement: video.engagementRate || 0,
        views: video.viewCount,
        likes: video.likeCount,
        comments: video.commentCount,
      });
    }

    return slots;
  }

  /**
   * Calculate average engagement and rank time slots
   */
  private static rankTimeSlots(
    performanceBySlot: Map<
      string,
      Array<{
        engagement: number;
        views: bigint;
        likes: bigint;
        comments: bigint;
      }>
    >,
  ): PostingTimeSlot[] {
    const rankedSlots: PostingTimeSlot[] = [];

    for (const [slotKey, performances] of performanceBySlot.entries()) {
      const [dayOfWeek, startHourStr] = slotKey.split("-");
      const startHour = parseInt(startHourStr, 10);
      const endHour = startHour + 2;

      const avgEngagement =
        performances.length > 0
          ? performances.reduce((sum, p) => sum + p.engagement, 0) /
            performances.length
          : 0;

      const avgViews =
        performances.length > 0
          ? Math.round(
              performances.reduce((sum, p) => sum + Number(p.views), 0) /
                performances.length,
            )
          : 0;

      const avgLikes =
        performances.length > 0
          ? Math.round(
              performances.reduce((sum, p) => sum + Number(p.likes), 0) /
                performances.length,
            )
          : 0;

      const confidence: "high" | "medium" | "low" =
        performances.length >= 3
          ? "high"
          : performances.length >= 2
            ? "medium"
            : "low";

      // Format hour range as "2 AM", "6 AM", "2 PM", etc.
      const hourRange = this.formatHourRange(startHour, endHour);

      rankedSlots.push({
        dayOfWeek,
        hourRange,
        startHour,
        endHour,
        averageEngagementRate: parseFloat(avgEngagement.toFixed(2)),
        videoCount: performances.length,
        averageViews: avgViews,
        averageLikes: avgLikes,
        confidence,
      });
    }

    // Sort by engagement rate descending
    return rankedSlots.sort(
      (a, b) => b.averageEngagementRate - a.averageEngagementRate,
    );
  }

  /**
   * Generate heatmap data for visualization (7 days x 24 hours)
   */
  private static generateHeatmapData(
    performanceBySlot: Map<string, Array<{ engagement: number }>>,
  ): HeatmapDataPoint[] {
    const heatmapData: HeatmapDataPoint[] = [];

    // Create empty heatmap structure
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayName = DAYS_OF_WEEK[dayIndex];

      // Create hourly granularity for better visualization
      for (let hour = 0; hour < 24; hour++) {
        heatmapData.push({
          day: dayName,
          dayIndex,
          hour,
          engagement: 0,
          views: 0,
          videoCount: 0,
        });
      }
    }

    // Fill in actual data from performance slots
    for (const [slotKey, performances] of performanceBySlot.entries()) {
      const [dayName, startHourStr] = slotKey.split("-");
      const startHour = parseInt(startHourStr, 10);
      const dayIndex = DAYS_OF_WEEK.indexOf(dayName);

      if (dayIndex === -1) continue;

      const avgEngagement =
        performances.length > 0
          ? performances.reduce((sum, p) => sum + p.engagement, 0) /
            performances.length
          : 0;
      const avgViews =
        performances.length > 0
          ? performances.reduce(
              (sum: number, p: any) => sum + Number(p.views || 0),
              0,
            ) / performances.length
          : 0;

      // Distribute 2-hour slot across both hours
      for (let offset = 0; offset < 2; offset++) {
        const hour = startHour + offset;
        if (hour >= 24) break;

        const index = dayIndex * 24 + hour;
        if (index < heatmapData.length) {
          heatmapData[index].engagement = parseFloat(avgEngagement.toFixed(2));
          heatmapData[index].views = Math.round(avgViews);
          heatmapData[index].videoCount = performances.length;
        }
      }
    }

    return heatmapData;
  }

  /**
   * Generate insights based on top posting times
   */
  private static generatePostingInsights(
    topSlots: PostingTimeSlot[],
    totalVideos: number,
  ): string[] {
    const insights: string[] = [];

    if (totalVideos < 3) {
      insights.push(
        "You need to analyze at least 3 videos to get reliable posting time recommendations. Keep tracking your videos!",
      );
      return insights;
    }

    // Insight 1: Best time
    if (topSlots.length > 0) {
      const best = topSlots[0];
      insights.push(
        `Your best time is ${best.dayOfWeek} at ${best.hourRange} with an average ${best.averageEngagementRate.toFixed(1)}% engagement rate (based on ${best.videoCount} videos).`,
      );
    }

    // Insight 2: Consistency
    const engagementRanges = topSlots.map((s) => s.averageEngagementRate);
    if (engagementRanges.length > 1) {
      const variance =
        Math.max(...engagementRanges) - Math.min(...engagementRanges);
      if (variance < 2) {
        insights.push(
          "Posting times have consistent performance—timing matters less than content quality for your niche.",
        );
      } else {
        insights.push(
          "There's significant variation in performance by time. Scheduling matters for your audience.",
        );
      }
    }

    // Insight 3: Recommendation
    const dayFrequency = topSlots.reduce(
      (acc, slot) => {
        acc[slot.dayOfWeek] = (acc[slot.dayOfWeek] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const bestDay = Object.entries(dayFrequency).sort(
      ([, a], [, b]) => b - a,
    )[0];
    if (bestDay) {
      insights.push(`${bestDay[0]}s are your strongest posting day overall.`);
    }

    // Insight 4: Weekend vs Weekday
    const weekdaySlots = topSlots.filter(
      (s) => !["Saturday", "Sunday"].includes(s.dayOfWeek),
    );
    const weekendSlots = topSlots.filter((s) =>
      ["Saturday", "Sunday"].includes(s.dayOfWeek),
    );

    if (weekdaySlots.length > weekendSlots.length) {
      insights.push(
        "Your audience is more engaged during weekdays—consider prioritizing weekday posts.",
      );
    } else if (weekendSlots.length > weekdaySlots.length) {
      insights.push(
        "Your audience is more active on weekends—plan your content accordingly.",
      );
    }

    return insights;
  }

  /**
   * Format hour as 12-hour time (e.g., "2-4 AM", "2-4 PM")
   */
  private static formatHourRange(startHour: number, endHour: number): string {
    const formatHour = (hour: number) => {
      if (hour === 0) return "12 AM";
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return "12 PM";
      return `${hour - 12} PM`;
    };

    const startFormatted = formatHour(startHour);
    const endFormatted = formatHour(endHour);

    // Extract just the time parts for the range
    const startTime = startFormatted.split(" ")[0];
    const startPeriod = startFormatted.split(" ")[1];
    const endTime = endFormatted.split(" ")[0];
    const endPeriod = endFormatted.split(" ")[1];

    if (startPeriod === endPeriod) {
      return `${startTime}-${endTime} ${startPeriod}`;
    } else {
      return `${startFormatted}-${endFormatted}`;
    }
  }
}

export default PostingTimeOptimizerService;
