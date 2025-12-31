/**
 * Detect Platform Response DTO
 * Response for platform detection endpoint
 */

export class DetectPlatformResponse {
  url!: string;
  platform!: string | null;
  supported!: boolean;
  supportedPlatforms!: string[];
}
