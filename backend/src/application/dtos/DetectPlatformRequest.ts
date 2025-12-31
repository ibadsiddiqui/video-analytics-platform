/**
 * Detect Platform Request DTO
 * Request body for platform detection endpoint
 */

import { IsUrl } from 'class-validator';

export class DetectPlatformRequest {
  @IsUrl({}, { message: 'Invalid URL format' })
  url!: string;
}
