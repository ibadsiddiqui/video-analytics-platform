/**
 * Compare Videos Request DTO
 * Request body for comparing multiple videos
 */

import { IsArray, ArrayMinSize, ArrayMaxSize, IsUrl } from 'class-validator';

export class CompareVideosRequest {
  @IsArray({ message: 'urls must be an array' })
  @ArrayMinSize(2, { message: 'At least 2 URLs are required for comparison' })
  @ArrayMaxSize(10, { message: 'Maximum 10 videos can be compared at once' })
  @IsUrl({}, { each: true, message: 'Each URL must be valid' })
  urls!: string[];
}
