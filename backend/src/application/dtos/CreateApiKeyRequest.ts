/**
 * Create API Key Request DTO
 */

import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateApiKeyRequest {
  @IsEnum(['YOUTUBE', 'INSTAGRAM'])
  platform!: 'YOUTUBE' | 'INSTAGRAM';

  @IsString()
  @MinLength(10, { message: 'API key must be at least 10 characters long' })
  @MaxLength(500, { message: 'API key must not exceed 500 characters' })
  apiKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Label must not exceed 100 characters' })
  label?: string;
}
