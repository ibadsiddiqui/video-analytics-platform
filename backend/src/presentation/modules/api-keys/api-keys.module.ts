import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { EncryptionModule } from '@infrastructure/encryption/encryption.module';
import { ExternalApisModule } from '@infrastructure/external-apis/external-apis.module';
import { AuthGuard } from '@presentation/guards/auth.guard';

/**
 * API Keys Module
 * Provides API key management endpoints for authenticated users
 */
@Module({
  imports: [DatabaseModule, EncryptionModule, ExternalApisModule],
  controllers: [ApiKeysController],
  providers: [AuthGuard],
})
export class ApiKeysModule {}
