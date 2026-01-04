import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ApplicationModule } from '@application/application.module';
import { CacheModule } from '@infrastructure/cache/cache.module';
import { OptionalAuthGuard } from '@presentation/guards/optional-auth.guard';
import { AnonymousRateLimitInterceptor } from '@presentation/interceptors/anonymous-rate-limit.interceptor';

/**
 * Analytics Module
 * Provides video analytics endpoints
 */
@Module({
  imports: [ApplicationModule, CacheModule],
  controllers: [AnalyticsController],
  providers: [OptionalAuthGuard, AnonymousRateLimitInterceptor],
})
export class AnalyticsModule {}
