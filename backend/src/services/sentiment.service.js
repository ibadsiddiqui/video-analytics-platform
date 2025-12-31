// Sentiment Analysis Service
const Sentiment = require('sentiment');
const natural = require('natural');

class SentimentService {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.TfIdf = natural.TfIdf;
  }

  // Analyze sentiment of a single text
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return { score: 0, comparative: 0, sentiment: 'NEUTRAL' };
    }

    // Clean HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
    
    const result = this.sentiment.analyze(cleanText);
    
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, result.comparative));
    
    // Classify sentiment
    let sentimentLabel = 'NEUTRAL';
    if (normalizedScore > 0.1) sentimentLabel = 'POSITIVE';
    else if (normalizedScore < -0.1) sentimentLabel = 'NEGATIVE';

    return {
      score: result.score,
      comparative: normalizedScore,
      sentiment: sentimentLabel,
      positive: result.positive,
      negative: result.negative,
    };
  }

  // Analyze multiple comments and return aggregated results
  analyzeComments(comments) {
    if (!comments || comments.length === 0) {
      return {
        overall: { score: 0, sentiment: 'NEUTRAL' },
        distribution: { positive: 0, neutral: 100, negative: 0 },
        analyzed: [],
      };
    }

    const analyzed = comments.map(comment => {
      const text = comment.content || comment.text || '';
      const analysis = this.analyzeText(text);
      
      return {
        ...comment,
        sentimentScore: analysis.comparative,
        sentiment: analysis.sentiment,
        positiveWords: analysis.positive,
        negativeWords: analysis.negative,
      };
    });

    // Calculate distribution
    const total = analyzed.length;
    const positive = analyzed.filter(c => c.sentiment === 'POSITIVE').length;
    const negative = analyzed.filter(c => c.sentiment === 'NEGATIVE').length;
    const neutral = total - positive - negative;

    // Calculate overall score (weighted by likes if available)
    let weightedSum = 0;
    let weightTotal = 0;
    
    analyzed.forEach(comment => {
      const weight = 1 + Math.log(1 + (comment.likeCount || 0));
      weightedSum += comment.sentimentScore * weight;
      weightTotal += weight;
    });

    const overallScore = weightTotal > 0 ? weightedSum / weightTotal : 0;
    
    let overallSentiment = 'NEUTRAL';
    if (overallScore > 0.1) overallSentiment = 'POSITIVE';
    else if (overallScore < -0.1) overallSentiment = 'NEGATIVE';

    return {
      overall: {
        score: parseFloat(overallScore.toFixed(4)),
        sentiment: overallSentiment,
      },
      distribution: {
        positive: Math.round((positive / total) * 100),
        neutral: Math.round((neutral / total) * 100),
        negative: Math.round((negative / total) * 100),
      },
      totalAnalyzed: total,
      analyzed: analyzed.slice(0, 50), // Return top 50 for display
    };
  }

  // Extract keywords using TF-IDF
  extractKeywords(texts, maxKeywords = 15) {
    if (!texts || texts.length === 0) {
      return [];
    }

    const tfidf = new this.TfIdf();
    
    // Add all texts to corpus
    texts.forEach(text => {
      const cleanText = (text || '')
        .replace(/<[^>]*>/g, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ');
      tfidf.addDocument(cleanText);
    });

    // Get terms with highest TF-IDF scores
    const termScores = {};
    
    for (let docIndex = 0; docIndex < texts.length; docIndex++) {
      tfidf.listTerms(docIndex).forEach(item => {
        // Filter out short words and common stopwords
        if (item.term.length < 3) return;
        if (this.isStopword(item.term)) return;
        
        termScores[item.term] = (termScores[item.term] || 0) + item.tfidf;
      });
    }

    // Sort by score and return top keywords
    return Object.entries(termScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([term, score]) => ({
        keyword: term,
        score: parseFloat(score.toFixed(2)),
      }));
  }

  // Extract hashtags from texts
  extractHashtags(texts, maxHashtags = 10) {
    if (!texts || texts.length === 0) {
      return [];
    }

    const hashtagCounts = {};
    
    texts.forEach(text => {
      const hashtags = (text || '').match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const normalized = tag.toLowerCase();
        hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1;
      });
    });

    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxHashtags)
      .map(([hashtag, count]) => ({
        hashtag,
        count,
      }));
  }

  // Check if word is a stopword
  isStopword(word) {
    const stopwords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
      'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
      'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
      'which', 'go', 'me', 'video', 'like', 'just', 'can', 'its', 'your',
      'was', 'are', 'been', 'has', 'had', 'did', 'does', 'is', 'am',
      'http', 'https', 'www', 'com', 'youtube', 'watch', 'really', 'very',
      'much', 'how', 'why', 'when', 'where', 'than', 'then', 'now', 'here',
    ]);
    
    return stopwords.has(word.toLowerCase());
  }

  // Generate engagement analysis by simulating daily patterns
  // (In production, this would use actual time-series data)
  generateEngagementByDay(viewCount, likeCount, commentCount, publishedAt) {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Generate realistic engagement patterns
    // Weekdays typically see more engagement, with peaks on Wed-Thu
    const patterns = [0.85, 0.92, 1.0, 0.98, 0.88, 0.75, 0.72];
    
    const totalEngagement = likeCount + commentCount;
    const avgDaily = totalEngagement / 7;
    
    return daysOfWeek.map((day, index) => ({
      day,
      engagement: Math.round(avgDaily * patterns[index] * (0.8 + Math.random() * 0.4)),
      views: Math.round((viewCount / 7) * patterns[index] * (0.8 + Math.random() * 0.4)),
    }));
  }

  // Generate simulated audience demographics
  // (Real data would come from YouTube Analytics API with OAuth)
  generateAudienceDemographics(channelType = 'general') {
    // These are typical distributions - in production, use actual data
    const ageDistributions = {
      general: [5, 18, 30, 25, 15, 7],
      tech: [3, 22, 35, 25, 10, 5],
      gaming: [12, 35, 28, 15, 7, 3],
      education: [8, 25, 28, 22, 12, 5],
    };

    const genderSplits = {
      general: { male: 55, female: 45 },
      tech: { male: 72, female: 28 },
      gaming: { male: 78, female: 22 },
      education: { male: 52, female: 48 },
    };

    const ages = ageDistributions[channelType] || ageDistributions.general;
    const genders = genderSplits[channelType] || genderSplits.general;

    return {
      ageDistribution: [
        { range: '13-17', percentage: ages[0] },
        { range: '18-24', percentage: ages[1] },
        { range: '25-34', percentage: ages[2] },
        { range: '35-44', percentage: ages[3] },
        { range: '45-54', percentage: ages[4] },
        { range: '55+', percentage: ages[5] },
      ],
      genderSplit: {
        male: genders.male,
        female: genders.female,
      },
    };
  }
}

module.exports = new SentimentService();
