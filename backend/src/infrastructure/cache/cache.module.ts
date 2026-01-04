/**
 * Cache Module
 * Global module providing Redis cache service across the application
 */

import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './RedisCacheService';

@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
