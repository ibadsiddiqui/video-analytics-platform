/**
 * Application Module
 * Aggregates all application use cases and services
 * Depends on infrastructure modules for external services
 */

import { Module } from '@nestjs/common';
import { ExternalApisModule } from '@infrastructure/external-apis/external-apis.module';
import { CacheModule } from '@infrastructure/cache/cache.module';
import { SentimentModule } from '@infrastructure/sentiment/sentiment.module';
import { EncryptionModule } from '@infrastructure/encryption/encryption.module';
import { ConfigModule } from '@shared/config/config.module';
import { AnalyzeVideoUseCase } from './use-cases/AnalyzeVideoUseCase';
import { CompareVideosUseCase } from './use-cases/CompareVideosUseCase';
import { DetectPlatformUseCase } from './use-cases/DetectPlatformUseCase';
import { GetVideoHistoryUseCase } from './use-cases/GetVideoHistoryUseCase';
import { ApiKeyResolverService } from './services/ApiKeyResolverService';

@Module({
  imports: [
    // Infrastructure modules
    ExternalApisModule,
    CacheModule,
    SentimentModule,
    EncryptionModule,
    ConfigModule,
  ],
  providers: [
    // Use cases
    AnalyzeVideoUseCase,
    CompareVideosUseCase,
    DetectPlatformUseCase,
    GetVideoHistoryUseCase,
    // Application services
    ApiKeyResolverService,
  ],
  exports: [
    // Export all use cases and services for use in feature modules
    AnalyzeVideoUseCase,
    CompareVideosUseCase,
    DetectPlatformUseCase,
    GetVideoHistoryUseCase,
    ApiKeyResolverService,
  ],
})
export class ApplicationModule {}
