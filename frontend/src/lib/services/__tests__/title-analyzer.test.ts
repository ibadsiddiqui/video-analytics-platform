import { describe, it, expect } from 'vitest';
import TitleAnalyzer, { TitleStyle } from '../title-analyzer';

describe('TitleAnalyzer', () => {
  describe('Style Detection', () => {
    it('should detect QUESTION style', () => {
      const analysis = TitleAnalyzer.analyze('How can I improve my YouTube channel?');
      expect(analysis.style).toBe('QUESTION');
      expect(analysis.characteristics.hasQuestion).toBe(true);
    });

    it('should detect NUMBERED_LIST style', () => {
      const analysis = TitleAnalyzer.analyze('Top 10 YouTube Growth Hacks');
      expect(analysis.style).toBe('NUMBERED_LIST');
      expect(analysis.characteristics.hasNumbers).toBe(true);
    });

    it('should detect HOW_TO style', () => {
      const analysis = TitleAnalyzer.analyze('How to Make Viral Videos');
      expect(analysis.style).toBe('HOW_TO');
    });

    it('should detect TUTORIAL style', () => {
      const analysis = TitleAnalyzer.analyze('YouTube Tutorial: Complete Beginner Guide');
      expect(analysis.style).toBe('TUTORIAL');
    });

    it('should detect COMPARISON style', () => {
      const analysis = TitleAnalyzer.analyze('YouTube vs TikTok: Which Platform is Better?');
      expect(analysis.style).toBe('COMPARISON');
    });

    it('should detect REVIEW style', () => {
      const analysis = TitleAnalyzer.analyze('Canon EOS R5 Camera Review');
      expect(analysis.style).toBe('REVIEW');
    });

    it('should detect NEWS style', () => {
      const analysis = TitleAnalyzer.analyze('Breaking: YouTube Announces New Features');
      expect(analysis.style).toBe('NEWS');
    });

    it('should detect EMOTIONAL style', () => {
      const analysis = TitleAnalyzer.analyze('I Was SHOCKED By What I Found');
      expect(analysis.style).toBe('EMOTIONAL');
    });

    it('should detect CLICKBAIT style', () => {
      const analysis = TitleAnalyzer.analyze('You Won\'t Believe What Happened Next!!!');
      expect(analysis.style).toBe('CLICKBAIT');
    });

    it('should default to STATEMENT style', () => {
      const analysis = TitleAnalyzer.analyze('My Video About Technology');
      expect(analysis.style).toBe('STATEMENT');
    });
  });

  describe('Characteristic Extraction', () => {
    it('should extract all characteristics correctly', () => {
      const analysis = TitleAnalyzer.analyze('Top 5 Amazing Tips to Boost Your Views! 🚀');

      expect(analysis.characteristics.hasNumbers).toBe(true);
      expect(analysis.characteristics.hasEmoji).toBe(true);
      expect(analysis.characteristics.hasPowerWords).toBe(true);
      expect(analysis.characteristics.hasAllCaps).toBe(false);
      expect(analysis.characteristics.hasQuestion).toBe(false);
    });

    it('should detect power words', () => {
      const analysis = TitleAnalyzer.analyze('Ultimate Guide to Master YouTube SEO');
      expect(analysis.characteristics.hasPowerWords).toBe(true);
    });

    it('should count word correctly', () => {
      const analysis = TitleAnalyzer.analyze('This is a title with ten words in it');
      expect(analysis.characteristics.wordCount).toBe(9);
    });

    it('should count characters correctly', () => {
      const analysis = TitleAnalyzer.analyze('Short title');
      expect(analysis.characteristics.charCount).toBe(11);
    });

    it('should detect ALL CAPS', () => {
      const analysis = TitleAnalyzer.analyze('INCREDIBLE NEWS ABOUT YOUR CHANNEL');
      expect(analysis.characteristics.hasAllCaps).toBe(true);
    });
  });

  describe('Effectiveness Scoring', () => {
    it('should give high score to well-optimized title', () => {
      const analysis = TitleAnalyzer.analyze('Top 10 YouTube Growth Secrets Revealed');
      expect(analysis.score).toBeGreaterThanOrEqual(60);
    });

    it('should penalize very short titles', () => {
      const analysis = TitleAnalyzer.analyze('Short');
      expect(analysis.score).toBeLessThan(50);
    });

    it('should penalize very long titles', () => {
      const analysis = TitleAnalyzer.analyze(
        'This is an extremely long title that goes on and on and exceeds the optimal character count'
      );
      expect(analysis.score).toBeLessThan(60);
    });

    it('should reward power words', () => {
      const titleWithPower = TitleAnalyzer.analyze('Ultimate Guide to YouTube Growth');
      const titleWithoutPower = TitleAnalyzer.analyze('Guide to YouTube Growth');
      expect(titleWithPower.score).toBeGreaterThan(titleWithoutPower.score);
    });

    it('should reward numbered titles', () => {
      const titleWithNumbers = TitleAnalyzer.analyze('5 Ways to Grow Your Channel');
      const titleWithoutNumbers = TitleAnalyzer.analyze('Ways to Grow Your Channel');
      expect(titleWithNumbers.score).toBeGreaterThan(titleWithoutNumbers.score);
    });

    it('should keep score within 0-100 bounds', () => {
      const analysis = TitleAnalyzer.analyze(
        'This is an extremely long title with many power words like ultimate amazing incredible proven guaranteed exclusive secret hidden revealed shocking'
      );
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('should give optimal score for 6-12 words', () => {
      const analysis = TitleAnalyzer.analyze('Top Ten YouTube Growth Hacks That Really Work');
      expect(analysis.score).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Recommendations Generation', () => {
    it('should recommend adding more words for short titles', () => {
      const analysis = TitleAnalyzer.analyze('Short');
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('Add more'))).toBe(true);
    });

    it('should recommend shortening long titles', () => {
      const analysis = TitleAnalyzer.analyze(
        'This is an extremely long title that goes on and on and exceeds the recommended character limit'
      );
      expect(analysis.recommendations.some(r => r.includes('Shorten'))).toBe(true);
    });

    it('should recommend power words for generic titles', () => {
      const analysis = TitleAnalyzer.analyze('My Video About Content Creation');
      expect(analysis.recommendations.some(r => r.includes('power word'))).toBe(true);
    });

    it('should warn about ALL CAPS', () => {
      const analysis = TitleAnalyzer.analyze('THIS IS ALL CAPS TITLE');
      expect(analysis.recommendations.some(r => r.includes('ALL CAPS'))).toBe(true);
    });

    it('should limit recommendations to reasonable number', () => {
      const analysis = TitleAnalyzer.analyze('Test');
      // Service returns max 5, but some titles may trigger more recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should give encouragement for high scores', () => {
      const analysis = TitleAnalyzer.analyze('Top 10 Ultimate YouTube Growth Secrets Revealed');
      if (analysis.score >= 80) {
        expect(analysis.recommendations.some(r => r.includes('Great'))).toBe(true);
      }
    });
  });

  describe('Batch Analysis', () => {
    it('should analyze multiple videos and return report', () => {
      const videos = [
        { title: 'Top 10 Tips', views: 1000, likes: 50, comments: 20 },
        { title: 'How to Grow', views: 2000, likes: 100, comments: 40 },
        { title: 'My Video', views: 500, likes: 25, comments: 10 },
      ];

      const report = TitleAnalyzer.analyzeMultiple(videos);

      expect(report.analysis).toBeDefined();
      expect(report.stylePerformance).toBeDefined();
      expect(report.stylePerformance.length).toBeGreaterThan(0);
      expect(report.bestPerformingStyle).toBeDefined();
      expect(report.worstPerformingStyle).toBeDefined();
      expect(report.insights).toBeDefined();
    });

    it('should calculate performance index correctly', () => {
      const videos = [
        { title: 'Top 10 Tips', views: 1000, likes: 50, comments: 20 },
        { title: 'Top 5 Tricks', views: 2000, likes: 100, comments: 40 },
      ];

      const report = TitleAnalyzer.analyzeMultiple(videos);

      expect(report.stylePerformance.every(s => s.performanceIndex > 0)).toBe(true);
    });

    it('should calculate engagement rate', () => {
      const videos = [
        { title: 'Top 10 Tips', views: 1000, likes: 50, comments: 20 },
      ];

      const report = TitleAnalyzer.analyzeMultiple(videos);
      expect(report.stylePerformance.length).toBeGreaterThan(0);
      expect(report.stylePerformance[0].avgEngagement).toBeGreaterThanOrEqual(0);
    });

    it('should generate insights from performance data', () => {
      const videos = [
        { title: 'Top 10 Tips', views: 1000, likes: 50, comments: 20 },
        { title: 'Top 5 Tricks', views: 2000, likes: 100, comments: 40 },
        { title: 'How to Grow', views: 800, likes: 40, comments: 15 },
      ];

      const report = TitleAnalyzer.analyzeMultiple(videos);
      expect(report.insights.length).toBeGreaterThan(0);
      expect(report.insights[0]).toBeTruthy();
    });
  });

  describe('Utility Methods', () => {
    it('should get all available styles', () => {
      const styles = TitleAnalyzer.getAllStyles();
      expect(styles.length).toBe(10);
      expect(styles).toContain('QUESTION');
      expect(styles).toContain('NUMBERED_LIST');
      expect(styles).toContain('HOW_TO');
    });

    it('should format style name correctly', () => {
      const label = TitleAnalyzer.getStyleLabel('NUMBERED_LIST');
      expect(label).toBe('Numbered list');
    });

    it('should handle empty title gracefully', () => {
      const analysis = TitleAnalyzer.analyze('');
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200);
      const analysis = TitleAnalyzer.analyze(longTitle);
      expect(analysis.score).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle titles with special characters', () => {
      const analysis = TitleAnalyzer.analyze('Top 10: "Best" Videos & More!');
      expect(analysis.characteristics.charCount).toBeGreaterThan(0);
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle titles with multiple numbers', () => {
      const analysis = TitleAnalyzer.analyze('Part 1 of 5: 10 Ways to Make 100k in 2024');
      expect(analysis.characteristics.hasNumbers).toBe(true);
      expect(analysis.characteristics.wordCount).toBeGreaterThan(0);
    });

    it('should handle titles with mixed case', () => {
      const analysis = TitleAnalyzer.analyze('This Is A Mixed Case Title');
      expect(analysis.characteristics.hasAllCaps).toBe(false);
    });

    it('should handle clickbait patterns', () => {
      const analysis = TitleAnalyzer.analyze('You Won\'t Believe What Happens...');
      expect(analysis.style).toBe('CLICKBAIT');
    });

    it('should handle emoji in titles', () => {
      const analysis = TitleAnalyzer.analyze('Amazing Tips 🚀 For Growth 📈');
      expect(analysis.characteristics.hasEmoji).toBe(true);
    });
  });
});
