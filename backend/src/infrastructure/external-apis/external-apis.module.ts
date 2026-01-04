/**
 * External APIs Module
 * Provides external API services (YouTube, Instagram) across the application
 */

import { Module } from '@nestjs/common';
import { YouTubeService } from './YouTubeService';
import { InstagramService } from './InstagramService';

@Module({
  providers: [YouTubeService, InstagramService],
  exports: [YouTubeService, InstagramService],
})
export class ExternalApisModule {}
