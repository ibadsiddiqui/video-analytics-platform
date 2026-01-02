/**
 * API Key Management Types
 * Defines interfaces for user API keys across different platforms
 */

export type ApiKeyPlatform = 'YOUTUBE' | 'INSTAGRAM';

export interface ApiKey {
  id: string;
  platform: ApiKeyPlatform;
  label: string | null;
  maskedKey: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddKeyRequest {
  platform: ApiKeyPlatform;
  apiKey: string;
  label?: string;
}

export interface UpdateKeyRequest {
  label?: string;
  isActive?: boolean;
}

export interface TestResult {
  valid: boolean;
  error?: string;
  quotaRemaining?: number;
}

export interface ApiKeyResponse {
  success: boolean;
  data?: ApiKey;
  error?: string;
}

export interface ApiKeysListResponse {
  success: boolean;
  data: ApiKey[];
  error?: string;
}

export interface TestKeyResponse {
  success: boolean;
  data?: TestResult;
  error?: string;
}

/**
 * Tier-based API key limits
 * Determines how many API keys users can create per tier
 */
export const API_KEY_LIMITS = {
  FREE: 0,
  CREATOR: 5,
  PRO: 20,
  AGENCY: 100,
} as const;
