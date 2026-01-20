/**
 * Thumbnail Analysis Service
 * Phase 4.2: Content Strategy Tools
 *
 * Analyzes thumbnail effectiveness using image analysis heuristics.
 * Uses statistical analysis of thumbnail characteristics that correlate
 * with higher click-through rates.
 *
 * Note: For production, consider integrating with Google Cloud Vision API
 * or AWS Rekognition for more sophisticated analysis.
 */

export interface ThumbnailAnalysis {
  url: string;
  score: number; // 0-100 overall effectiveness score
  factors: {
    hasFace: "unknown" | "likely" | "unlikely";
    hasText: "unknown" | "likely" | "unlikely";
    colorContrast: "high" | "medium" | "low" | "unknown";
    brightness: "optimal" | "too_bright" | "too_dark" | "unknown";
    aspectRatio: "standard" | "non_standard";
    resolution: "hd" | "sd" | "low" | "unknown";
  };
  recommendations: string[];
  bestPractices: {
    followed: string[];
    missing: string[];
  };
}

export interface ThumbnailComparisonResult {
  thumbnails: Array<{
    url: string;
    score: number;
    rank: number;
  }>;
  winner: string;
  insights: string[];
}

// Standard YouTube thumbnail dimensions
const YOUTUBE_THUMBNAIL_WIDTH = 1280;
const YOUTUBE_THUMBNAIL_HEIGHT = 720;
const YOUTUBE_ASPECT_RATIO = 16 / 9;

// Best practices for thumbnails
const THUMBNAIL_BEST_PRACTICES = [
  {
    id: "resolution",
    name: "High Resolution (1280x720)",
    description: "Use HD resolution for crisp display across devices",
  },
  {
    id: "aspectRatio",
    name: "16:9 Aspect Ratio",
    description: "Standard YouTube aspect ratio prevents letterboxing",
  },
  {
    id: "face",
    name: "Human Face",
    description: "Thumbnails with faces typically get 38% more clicks",
  },
  {
    id: "text",
    name: "Readable Text",
    description: "Short, bold text helps communicate video content",
  },
  {
    id: "contrast",
    name: "High Contrast",
    description: "Strong contrast ensures visibility on any background",
  },
  {
    id: "brightness",
    name: "Optimal Brightness",
    description: "Balanced lighting makes thumbnails more appealing",
  },
  {
    id: "branding",
    name: "Consistent Branding",
    description: "Brand elements help with channel recognition",
  },
  {
    id: "emotion",
    name: "Emotional Expression",
    description: "Strong emotions (surprise, excitement) drive clicks",
  },
];

export class ThumbnailAnalyzer {
  /**
   * Analyze a thumbnail URL
   * This performs heuristic-based analysis without actually fetching the image.
   * For production, integrate with a vision API for accurate analysis.
   */
  static async analyze(
    thumbnailUrl: string,
    videoTitle?: string
  ): Promise<ThumbnailAnalysis> {
    const factors = await this.analyzeFactors(thumbnailUrl);
    const score = this.calculateScore(factors);
    const recommendations = this.generateRecommendations(factors, videoTitle);
    const bestPractices = this.checkBestPractices(factors);

    return {
      url: thumbnailUrl,
      score,
      factors,
      recommendations,
      bestPractices,
    };
  }

  /**
   * Analyze thumbnail factors from URL patterns and metadata
   */
  private static async analyzeFactors(
    url: string
  ): Promise<ThumbnailAnalysis["factors"]> {
    // Extract resolution hints from URL
    const resolution = this.detectResolution(url);
    const aspectRatio = this.detectAspectRatio(url);

    // These would be detected by vision API in production
    // For now, return "unknown" for image-based factors
    return {
      hasFace: "unknown",
      hasText: "unknown",
      colorContrast: "unknown",
      brightness: "unknown",
      aspectRatio,
      resolution,
    };
  }

  /**
   * Detect resolution from URL patterns (YouTube-specific)
   */
  private static detectResolution(
    url: string
  ): "hd" | "sd" | "low" | "unknown" {
    const lowerUrl = url.toLowerCase();

    // YouTube thumbnail URL patterns
    if (
      lowerUrl.includes("maxresdefault") ||
      lowerUrl.includes("hq720") ||
      lowerUrl.includes("sddefault")
    ) {
      return "hd";
    }

    if (lowerUrl.includes("hqdefault") || lowerUrl.includes("mqdefault")) {
      return "sd";
    }

    if (lowerUrl.includes("default") && !lowerUrl.includes("maxres")) {
      return "low";
    }

    // Check for dimension hints in URL
    const widthMatch = url.match(/w[=_]?(\d+)/i);
    if (widthMatch) {
      const width = parseInt(widthMatch[1], 10);
      if (width >= 1280) return "hd";
      if (width >= 640) return "sd";
      return "low";
    }

    return "unknown";
  }

  /**
   * Detect aspect ratio from URL patterns
   */
  private static detectAspectRatio(url: string): "standard" | "non_standard" {
    // YouTube uses standard 16:9 for all thumbnails
    if (url.includes("youtube") || url.includes("ytimg")) {
      return "standard";
    }

    // Instagram uses square thumbnails
    if (url.includes("instagram") || url.includes("cdninstagram")) {
      return "non_standard";
    }

    return "standard";
  }

  /**
   * Calculate overall effectiveness score
   */
  private static calculateScore(
    factors: ThumbnailAnalysis["factors"]
  ): number {
    let score = 50; // Base score

    // Resolution scoring
    switch (factors.resolution) {
      case "hd":
        score += 20;
        break;
      case "sd":
        score += 10;
        break;
      case "low":
        score -= 10;
        break;
    }

    // Aspect ratio scoring
    if (factors.aspectRatio === "standard") {
      score += 10;
    } else {
      score -= 5;
    }

    // Face detection scoring
    if (factors.hasFace === "likely") {
      score += 15;
    } else if (factors.hasFace === "unknown") {
      // Don't penalize, but suggest verification
      score += 5;
    }

    // Text detection scoring
    if (factors.hasText === "likely") {
      score += 10;
    }

    // Color contrast scoring
    switch (factors.colorContrast) {
      case "high":
        score += 10;
        break;
      case "medium":
        score += 5;
        break;
      case "low":
        score -= 5;
        break;
    }

    // Brightness scoring
    switch (factors.brightness) {
      case "optimal":
        score += 10;
        break;
      case "too_bright":
      case "too_dark":
        score -= 5;
        break;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    factors: ThumbnailAnalysis["factors"],
    videoTitle?: string
  ): string[] {
    const recommendations: string[] = [];

    // Resolution recommendations
    if (factors.resolution === "low") {
      recommendations.push(
        "Upload a higher resolution thumbnail (1280x720) for better visibility across devices"
      );
    } else if (factors.resolution === "sd") {
      recommendations.push(
        "Consider upgrading to HD resolution (1280x720) for maximum quality"
      );
    }

    // Aspect ratio recommendations
    if (factors.aspectRatio === "non_standard") {
      recommendations.push(
        "Use 16:9 aspect ratio to prevent letterboxing on YouTube"
      );
    }

    // Face detection recommendations
    if (factors.hasFace === "unknown" || factors.hasFace === "unlikely") {
      recommendations.push(
        "Consider including a human face - thumbnails with faces get 38% more clicks on average"
      );
    }

    // Text recommendations
    if (factors.hasText === "unknown") {
      recommendations.push(
        "Add 2-4 words of bold, readable text to complement your title"
      );
    }

    // General best practices
    recommendations.push(
      "Use contrasting colors to stand out in search results and suggested videos"
    );

    if (videoTitle && videoTitle.length > 0) {
      recommendations.push(
        "Ensure your thumbnail visually represents your title's promise"
      );
    }

    recommendations.push(
      "A/B test different thumbnail styles to see what works best for your audience"
    );

    return recommendations.slice(0, 5);
  }

  /**
   * Check which best practices are followed
   */
  private static checkBestPractices(
    factors: ThumbnailAnalysis["factors"]
  ): ThumbnailAnalysis["bestPractices"] {
    const followed: string[] = [];
    const missing: string[] = [];

    // Resolution check
    if (factors.resolution === "hd") {
      followed.push("High Resolution (1280x720)");
    } else {
      missing.push("High Resolution (1280x720)");
    }

    // Aspect ratio check
    if (factors.aspectRatio === "standard") {
      followed.push("16:9 Aspect Ratio");
    } else {
      missing.push("16:9 Aspect Ratio");
    }

    // Face check
    if (factors.hasFace === "likely") {
      followed.push("Human Face");
    } else if (factors.hasFace === "unlikely") {
      missing.push("Human Face");
    }

    // Text check
    if (factors.hasText === "likely") {
      followed.push("Readable Text");
    } else if (factors.hasText === "unlikely") {
      missing.push("Readable Text");
    }

    // Contrast check
    if (factors.colorContrast === "high") {
      followed.push("High Contrast");
    } else if (factors.colorContrast === "low") {
      missing.push("High Contrast");
    }

    // Brightness check
    if (factors.brightness === "optimal") {
      followed.push("Optimal Brightness");
    } else if (
      factors.brightness === "too_bright" ||
      factors.brightness === "too_dark"
    ) {
      missing.push("Optimal Brightness");
    }

    return { followed, missing };
  }

  /**
   * Compare multiple thumbnails
   */
  static async compareMultiple(
    thumbnailUrls: string[]
  ): Promise<ThumbnailComparisonResult> {
    const analyses = await Promise.all(
      thumbnailUrls.map((url) => this.analyze(url))
    );

    // Rank by score
    const ranked = analyses
      .map((analysis, index) => ({
        url: thumbnailUrls[index],
        score: analysis.score,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // Generate comparison insights
    const insights = this.generateComparisonInsights(analyses);

    return {
      thumbnails: ranked,
      winner: ranked[0]?.url || "",
      insights,
    };
  }

  /**
   * Generate insights from comparing multiple thumbnails
   */
  private static generateComparisonInsights(
    analyses: ThumbnailAnalysis[]
  ): string[] {
    const insights: string[] = [];

    if (analyses.length < 2) {
      return ["Add more thumbnails to compare"];
    }

    const scores = analyses.map((a) => a.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    insights.push(
      `Score range: ${minScore} - ${maxScore} (average: ${Math.round(avgScore)})`
    );

    if (maxScore - minScore > 20) {
      insights.push(
        "Significant quality variation detected - the top thumbnail is notably stronger"
      );
    }

    // Check for common issues
    const lowResCount = analyses.filter(
      (a) => a.factors.resolution === "low"
    ).length;
    if (lowResCount > 0) {
      insights.push(
        `${lowResCount} thumbnail(s) have low resolution - consider upgrading`
      );
    }

    return insights;
  }

  /**
   * Get all best practices for display
   */
  static getBestPractices(): typeof THUMBNAIL_BEST_PRACTICES {
    return THUMBNAIL_BEST_PRACTICES;
  }

  /**
   * Get score label for display
   */
  static getScoreLabel(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    if (score >= 20) return "Below Average";
    return "Needs Improvement";
  }

  /**
   * Get score color class for display
   */
  static getScoreColorClass(score: number): string {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  }
}

export default ThumbnailAnalyzer;
