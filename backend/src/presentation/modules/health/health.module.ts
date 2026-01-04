import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ConfigModule } from '@shared/config/config.module';

/**
 * Health Module
 * Provides health check endpoint for monitoring
 */
@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
