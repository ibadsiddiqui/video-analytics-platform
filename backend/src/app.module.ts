/**
 * App Module
 * Root module that imports all feature and infrastructure modules
 */

import { Module } from '@nestjs/common';

// Global modules
import { ConfigModule } from '@shared/config/config.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { CacheModule } from '@infrastructure/cache/cache.module';

// Infrastructure modules
import { ExternalApisModule } from '@infrastructure/external-apis/external-apis.module';
import { SentimentModule } from '@infrastructure/sentiment/sentiment.module';
import { EncryptionModule } from '@infrastructure/encryption/encryption.module';

// Application module
import { ApplicationModule } from '@application/application.module';

// Feature modules
import { HealthModule } from '@presentation/modules/health/health.module';
import { AnalyticsModule } from '@presentation/modules/analytics/analytics.module';
// import { AuthModule } from '@presentation/modules/auth/auth.module';
// import { ApiKeysModule } from '@presentation/modules/api-keys/api-keys.module';

@Module({
  imports: [
    // Global configuration and infrastructure
    ConfigModule,
    DatabaseModule,
    CacheModule,

    // Infrastructure services
    ExternalApisModule,
    SentimentModule,
    EncryptionModule,

    // Application layer (use cases)
    ApplicationModule,

    // Feature modules
    HealthModule,
    AnalyticsModule,
    // TODO: Uncomment when Phase 5 is complete
    // AuthModule,
    // ApiKeysModule,
  ],
})
export class AppModule {}
