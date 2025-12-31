/**
 * Video Platform Enumeration
 * Supported video platforms
 */
export enum Platform {
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  VIMEO = 'VIMEO',
  OTHER = 'OTHER',
}

/**
 * Platform domain patterns for URL matching
 */
export const PLATFORM_DOMAINS: Record<Platform, string[]> = {
  [Platform.YOUTUBE]: [
    'youtube.com',
    'youtu.be',
    'www.youtube.com',
    'm.youtube.com',
  ],
  [Platform.INSTAGRAM]: [
    'instagram.com',
    'www.instagram.com',
  ],
  [Platform.TIKTOK]: [
    'tiktok.com',
    'www.tiktok.com',
  ],
  [Platform.VIMEO]: [
    'vimeo.com',
    'www.vimeo.com',
  ],
  [Platform.OTHER]: [],
};
