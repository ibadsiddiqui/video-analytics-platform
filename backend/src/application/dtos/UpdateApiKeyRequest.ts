/**
 * Update API Key Request DTO
 */

import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class UpdateApiKeyRequest {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Label must not exceed 100 characters' })
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
