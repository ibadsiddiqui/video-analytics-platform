/**
 * Sentiment Module
 * Provides sentiment analysis service across the application
 */

import { Module } from '@nestjs/common';
import { SentimentService } from './SentimentService';

@Module({
  providers: [SentimentService],
  exports: [SentimentService],
})
export class SentimentModule {}
