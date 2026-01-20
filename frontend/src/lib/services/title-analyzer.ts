/**
 * Title A/B Testing Analyzer Service
 * Phase 4.1: Content Strategy Tools
 *
 * Analyzes which title styles perform best for video content
 * by categorizing titles and correlating with performance metrics.
 */

export type TitleStyle =
  | "QUESTION"
  | "NUMBERED_LIST"
  | "HOW_TO"
  | "EMOTIONAL"
  | "CLICKBAIT"
  | "STATEMENT"
  | "COMPARISON"
  | "TUTORIAL"
  | "NEWS"
  | "REVIEW";

export interface TitleAnalysis {
  title: string;
  style: TitleStyle;
  characteristics: {
    hasQuestion: boolean;
    hasNumbers: boolean;
    hasEmoji: boolean;
    hasPowerWords: boolean;
    hasAllCaps: boolean;
    wordCount: number;
    charCount: number;
  };
  score: number; // 0-100 effectiveness score
  recommendations: string[];
}

export interface TitleStylePerformance {
  style: TitleStyle;
  count: number;
  avgViews: number;
  avgEngagement: number;
  avgCTR: number;
  performanceIndex: number; // Relative to other styles
}

export interface TitleAnalysisReport {
  analysis: TitleAnalysis;
  stylePerformance: TitleStylePerformance[];
  bestPerformingStyle: TitleStyle;
  worstPerformingStyle: TitleStyle;
  insights: string[];
}

// Power words that drive engagement
const POWER_WORDS = [
  // Urgency
  "now",
  "today",
  "immediately",
  "urgent",
  "breaking",
  "limited",
  "last chance",
  "hurry",
  // Curiosity
  "secret",
  "hidden",
  "revealed",
  "shocking",
  "surprising",
  "unexpected",
  "truth",
  "finally",
  // Value
  "free",
  "best",
  "ultimate",
  "complete",
  "essential",
  "proven",
  "guaranteed",
  "exclusive",
  // Emotion
  "amazing",
  "incredible",
  "insane",
  "epic",
  "crazy",
  "mind-blowing",
  "unbelievable",
  "awesome",
  // Action
  "discover",
  "learn",
  "master",
  "transform",
  "boost",
  "unlock",
  "achieve",
  "dominate",
];

// Emotional trigger words
const EMOTIONAL_WORDS = [
  "love",
  "hate",
  "fear",
  "angry",
  "happy",
  "sad",
  "excited",
  "shocked",
  "heartbroken",
  "thrilled",
  "devastated",
  "overjoyed",
  "terrified",
  "furious",
  "anxious",
  "emotional",
  "crying",
  "laughing",
  "screaming",
];

// Clickbait indicators
const CLICKBAIT_PATTERNS = [
  /you won't believe/i,
  /what happens next/i,
  /will shock you/i,
  /gone wrong/i,
  /not clickbait/i,
  /\(.*?\)/i, // Parenthetical additions
  /\.{3}$/i, // Trailing ellipsis
  /!!!+/i, // Multiple exclamation marks
  /\?\?+/i, // Multiple question marks
];

export class TitleAnalyzer {
  /**
   * Analyze a single video title
   */
  static analyze(title: string): TitleAnalysis {
    const characteristics = this.extractCharacteristics(title);
    const style = this.detectStyle(title, characteristics);
    const score = this.calculateScore(title, characteristics);
    const recommendations = this.generateRecommendations(
      title,
      characteristics,
      style,
      score,
    );

    return {
      title,
      style,
      characteristics,
      score,
      recommendations,
    };
  }

  /**
   * Extract title characteristics
   */
  private static extractCharacteristics(
    title: string,
  ): TitleAnalysis["characteristics"] {
    const lowerTitle = title.toLowerCase();

    return {
      hasQuestion: /\?/.test(title),
      hasNumbers: /\d+/.test(title),
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(title),
      hasPowerWords: POWER_WORDS.some((word) =>
        lowerTitle.includes(word.toLowerCase()),
      ),
      hasAllCaps: /[A-Z]{3,}/.test(title),
      wordCount: title.split(/\s+/).filter(Boolean).length,
      charCount: title.length,
    };
  }

  /**
   * Detect the primary title style
   */
  private static detectStyle(
    title: string,
    characteristics: TitleAnalysis["characteristics"],
  ): TitleStyle {
    const lowerTitle = title.toLowerCase();

    // Check for numbered lists (Top 10, 5 Ways, etc.)
    if (
      /^\d+\s|top\s*\d+|\d+\s*(ways|tips|things|reasons|steps|hacks|tricks)/i.test(
        title,
      )
    ) {
      return "NUMBERED_LIST";
    }

    // Check for how-to titles
    if (/^how\s+to|how\s+i|learn\s+to|guide\s+to/i.test(title)) {
      return "HOW_TO";
    }

    // Check for tutorial titles
    if (
      /tutorial|walkthrough|beginners?\s+guide|step[\s-]*by[\s-]*step/i.test(
        title,
      )
    ) {
      return "TUTORIAL";
    }

    // Check for comparison titles
    if (
      /\bvs\.?\b|versus|compared|comparison|better than|which\s+is/i.test(title)
    ) {
      return "COMPARISON";
    }

    // Check for review titles
    if (
      /\breview\b|unboxing|first\s+look|hands[\s-]*on|honest\s+opinion/i.test(
        title,
      )
    ) {
      return "REVIEW";
    }

    // Check for news/announcement titles
    if (
      /\bnews\b|announced|breaking|official|update|release|launch/i.test(title)
    ) {
      return "NEWS";
    }

    // Check for clickbait
    if (CLICKBAIT_PATTERNS.some((pattern) => pattern.test(title))) {
      return "CLICKBAIT";
    }

    // Check for emotional titles
    if (EMOTIONAL_WORDS.some((word) => lowerTitle.includes(word))) {
      return "EMOTIONAL";
    }

    // Check for questions
    if (characteristics.hasQuestion) {
      return "QUESTION";
    }

    // Default to statement
    return "STATEMENT";
  }

  /**
   * Calculate title effectiveness score (0-100)
   */
  private static calculateScore(
    title: string,
    characteristics: TitleAnalysis["characteristics"],
  ): number {
    let score = 50; // Base score

    // Word count scoring (optimal: 6-12 words)
    if (characteristics.wordCount >= 6 && characteristics.wordCount <= 12) {
      score += 15;
    } else if (
      characteristics.wordCount >= 4 &&
      characteristics.wordCount <= 15
    ) {
      score += 8;
    } else if (characteristics.wordCount < 4) {
      score -= 10;
    } else {
      score -= 5;
    }

    // Character count scoring (optimal: 40-60 characters for YouTube)
    if (characteristics.charCount >= 40 && characteristics.charCount <= 60) {
      score += 15;
    } else if (
      characteristics.charCount >= 30 &&
      characteristics.charCount <= 70
    ) {
      score += 8;
    } else if (characteristics.charCount > 100) {
      score -= 10; // Too long, gets truncated
    }

    // Power words bonus
    if (characteristics.hasPowerWords) {
      score += 10;
    }

    // Numbers bonus (people love lists and specifics)
    if (characteristics.hasNumbers) {
      score += 8;
    }

    // Question bonus (drives curiosity)
    if (characteristics.hasQuestion) {
      score += 5;
    }

    // Emoji consideration (can help or hurt)
    if (characteristics.hasEmoji) {
      score += 3; // Slight positive for attention
    }

    // All caps penalty (looks spammy)
    if (characteristics.hasAllCaps) {
      score -= 8;
    }

    // Clickbait penalty
    if (CLICKBAIT_PATTERNS.some((pattern) => pattern.test(title))) {
      score -= 5;
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations for title improvement
   */
  private static generateRecommendations(
    title: string,
    characteristics: TitleAnalysis["characteristics"],
    style: TitleStyle,
    score: number,
  ): string[] {
    const recommendations: string[] = [];

    // Word count recommendations
    if (characteristics.wordCount < 4) {
      recommendations.push(
        "Add more context - titles with 6-12 words tend to perform better",
      );
    } else if (characteristics.wordCount > 15) {
      recommendations.push(
        "Shorten your title - aim for 6-12 words for better readability",
      );
    }

    // Character count recommendations
    if (characteristics.charCount > 70) {
      recommendations.push(
        "Title may be truncated in search results - keep under 60 characters",
      );
    } else if (characteristics.charCount < 30) {
      recommendations.push(
        "Consider adding more detail to your title for better context",
      );
    }

    // Power words
    if (!characteristics.hasPowerWords) {
      recommendations.push(
        "Try adding power words like 'ultimate', 'proven', or 'essential' to increase engagement",
      );
    }

    // Numbers
    if (!characteristics.hasNumbers && style === "STATEMENT") {
      recommendations.push(
        "Consider using numbers (e.g., 'Top 5', '3 Ways') - numbered titles often get more clicks",
      );
    }

    // Question titles
    if (style === "STATEMENT" && !characteristics.hasQuestion) {
      recommendations.push(
        "Try framing your title as a question to spark curiosity",
      );
    }

    // All caps warning
    if (characteristics.hasAllCaps) {
      recommendations.push(
        "Avoid ALL CAPS - it can appear spammy and reduce click-through rates",
      );
    }

    // Style-specific recommendations
    switch (style) {
      case "CLICKBAIT":
        recommendations.push(
          "Consider toning down clickbait elements - they can hurt long-term channel trust",
        );
        break;
      case "STATEMENT":
        recommendations.push(
          "Generic statement titles may blend in - try making it more specific or intriguing",
        );
        break;
      case "REVIEW":
        recommendations.push(
          "For reviews, consider adding 'Honest' or specific aspects you'll cover",
        );
        break;
    }

    // Good score encouragement
    if (score >= 80) {
      recommendations.push(
        "Great title structure! Consider A/B testing variations",
      );
    }

    return recommendations;
  }

  /**
   * Analyze multiple titles and generate performance report
   */
  static analyzeMultiple(
    videos: Array<{
      title: string;
      views: number;
      likes: number;
      comments: number;
    }>,
  ): TitleAnalysisReport {
    // Analyze each title
    const analyses = videos.map((v) => ({
      ...this.analyze(v.title),
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      engagement: v.views > 0 ? ((v.likes + v.comments) / v.views) * 100 : 0,
    }));

    // Group by style
    const styleGroups = new Map<
      TitleStyle,
      Array<{
        views: number;
        engagement: number;
      }>
    >();

    for (const analysis of analyses) {
      if (!styleGroups.has(analysis.style)) {
        styleGroups.set(analysis.style, []);
      }
      styleGroups.get(analysis.style)!.push({
        views: analysis.views,
        engagement: analysis.engagement,
      });
    }

    // Calculate performance per style
    const stylePerformance: TitleStylePerformance[] = [];
    let totalAvgViews = 0;
    let styleCount = 0;

    for (const [style, data] of styleGroups.entries()) {
      const avgViews = data.reduce((sum, d) => sum + d.views, 0) / data.length;
      const avgEngagement =
        data.reduce((sum, d) => sum + d.engagement, 0) / data.length;

      totalAvgViews += avgViews;
      styleCount++;

      stylePerformance.push({
        style,
        count: data.length,
        avgViews: Math.round(avgViews),
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        avgCTR: 0, // Would need impression data
        performanceIndex: 0, // Will calculate after
      });
    }

    // Calculate performance index (relative to average)
    const overallAvgViews = styleCount > 0 ? totalAvgViews / styleCount : 0;
    for (const sp of stylePerformance) {
      sp.performanceIndex =
        overallAvgViews > 0
          ? Math.round((sp.avgViews / overallAvgViews) * 100)
          : 100;
    }

    // Sort by performance
    stylePerformance.sort((a, b) => b.performanceIndex - a.performanceIndex);

    // Generate insights
    const insights = this.generateInsights(stylePerformance, analyses);

    // Get best/worst styles
    const bestStyle = stylePerformance[0]?.style || "STATEMENT";
    const worstStyle =
      stylePerformance[stylePerformance.length - 1]?.style || "STATEMENT";

    return {
      analysis: analyses[0] || this.analyze(""),
      stylePerformance,
      bestPerformingStyle: bestStyle,
      worstPerformingStyle: worstStyle,
      insights,
    };
  }

  /**
   * Generate insights from performance data
   */
  private static generateInsights(
    stylePerformance: TitleStylePerformance[],
    analyses: Array<TitleAnalysis & { views: number; engagement: number }>,
  ): string[] {
    const insights: string[] = [];

    if (stylePerformance.length === 0) {
      return ["Not enough data to generate insights"];
    }

    // Best performing style insight
    const best = stylePerformance[0];
    if (best && best.count >= 2) {
      insights.push(
        `${this.formatStyle(best.style)} titles perform ${best.performanceIndex - 100 > 0 ? `${best.performanceIndex - 100}% above` : "at"} your average`,
      );
    }

    // Worst performing style insight
    const worst = stylePerformance[stylePerformance.length - 1];
    if (worst && worst.count >= 2 && worst !== best) {
      insights.push(
        `${this.formatStyle(worst.style)} titles underperform by ${100 - worst.performanceIndex}%`,
      );
    }

    // Numbered list insight
    const numberedList = stylePerformance.find(
      (s) => s.style === "NUMBERED_LIST",
    );
    if (numberedList && numberedList.count >= 2) {
      if (numberedList.performanceIndex >= 110) {
        insights.push(
          "Your audience responds well to numbered list titles - consider creating more",
        );
      }
    }

    // Question titles insight
    const questionStyle = stylePerformance.find((s) => s.style === "QUESTION");
    if (questionStyle && questionStyle.count >= 2) {
      if (questionStyle.performanceIndex >= 105) {
        insights.push(
          "Question-style titles drive curiosity - they're working well for you",
        );
      } else if (questionStyle.performanceIndex < 90) {
        insights.push(
          "Question titles aren't performing well - try more direct statements",
        );
      }
    }

    // Title length insight
    const avgWordCount =
      analyses.reduce((sum, a) => sum + a.characteristics.wordCount, 0) /
      analyses.length;
    if (avgWordCount < 5) {
      insights.push(
        "Your titles tend to be short - adding more context could improve performance",
      );
    } else if (avgWordCount > 12) {
      insights.push("Your titles are quite long - consider being more concise");
    }

    // Power words insight
    const withPowerWords = analyses.filter(
      (a) => a.characteristics.hasPowerWords,
    );
    const withoutPowerWords = analyses.filter(
      (a) => !a.characteristics.hasPowerWords,
    );
    if (withPowerWords.length >= 2 && withoutPowerWords.length >= 2) {
      const avgWithPower =
        withPowerWords.reduce((s, a) => s + a.views, 0) / withPowerWords.length;
      const avgWithoutPower =
        withoutPowerWords.reduce((s, a) => s + a.views, 0) /
        withoutPowerWords.length;
      if (avgWithPower > avgWithoutPower * 1.1) {
        insights.push(
          `Titles with power words get ${Math.round((avgWithPower / avgWithoutPower - 1) * 100)}% more views for your channel`,
        );
      }
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Format style name for display
   */
  private static formatStyle(style: TitleStyle): string {
    const styleNames: Record<TitleStyle, string> = {
      QUESTION: "Question",
      NUMBERED_LIST: "Numbered list",
      HOW_TO: "How-to",
      EMOTIONAL: "Emotional",
      CLICKBAIT: "Clickbait",
      STATEMENT: "Statement",
      COMPARISON: "Comparison",
      TUTORIAL: "Tutorial",
      NEWS: "News/Announcement",
      REVIEW: "Review",
    };
    return styleNames[style] || style;
  }

  /**
   * Get style label for display
   */
  static getStyleLabel(style: TitleStyle): string {
    return this.formatStyle(style);
  }

  /**
   * Get all available title styles
   */
  static getAllStyles(): TitleStyle[] {
    return [
      "QUESTION",
      "NUMBERED_LIST",
      "HOW_TO",
      "EMOTIONAL",
      "CLICKBAIT",
      "STATEMENT",
      "COMPARISON",
      "TUTORIAL",
      "NEWS",
      "REVIEW",
    ];
  }
}

export default TitleAnalyzer;
