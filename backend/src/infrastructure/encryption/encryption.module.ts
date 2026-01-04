/**
 * Encryption Module
 * Provides encryption service across the application
 */

import { Module } from '@nestjs/common';
import { EncryptionService } from './EncryptionService';

@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
