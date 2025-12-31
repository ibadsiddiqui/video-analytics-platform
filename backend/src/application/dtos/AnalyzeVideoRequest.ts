/**
 * Analyze Video Request DTO
 * Request body for video analysis endpoint
 */

import { IsUrl, IsOptional, IsBoolean } from 'class-validator';

export class AnalyzeVideoRequest {
  @IsUrl({}, { message: 'Invalid URL format' })
  url!: string;

  @IsOptional()
  @IsBoolean({ message: 'skipCache must be a boolean' })
  skipCache?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'includeSentiment must be a boolean' })
  includeSentiment?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'includeKeywords must be a boolean' })
  includeKeywords?: boolean;
}
