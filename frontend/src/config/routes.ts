/**
 * Application Routes Configuration
 * Centralized route definitions for type-safe navigation
 */

/**
 * Public routes (accessible without authentication)
 */
export const ROUTES = {
  // Main pages
  HOME: '/',
  PRO_FEATURES: '/pro-features',

  // Authentication
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',

  // Guides
  GUIDE: {
    YOUTUBE_API_KEY: '/guide/youtube-api-key',
  },
} as const;

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/ibadsiddiqui',
  GOOGLE_CLOUD_CONSOLE: 'https://console.cloud.google.com/',
  GOOGLE_CLOUD_API_LIBRARY: 'https://console.cloud.google.com/apis/library',
  YOUTUBE_API_QUOTAS: 'https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas',
} as const;

/**
 * Type helper for route values
 */
export type Route = typeof ROUTES[keyof typeof ROUTES] | typeof ROUTES.GUIDE[keyof typeof ROUTES.GUIDE];
