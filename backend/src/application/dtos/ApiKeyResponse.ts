/**
 * API Key Response DTO
 */

export class ApiKeyResponse {
  id!: string;
  platform!: string;
  label?: string;
  maskedKey!: string;
  isActive!: boolean;
  lastUsedAt?: string;
  createdAt!: string;
  updatedAt!: string;

  constructor(data: {
    id: string;
    platform: string;
    label?: string | null;
    maskedKey: string;
    isActive: boolean;
    lastUsedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.platform = data.platform;
    this.label = data.label || undefined;
    this.maskedKey = data.maskedKey;
    this.isActive = data.isActive;
    this.lastUsedAt = data.lastUsedAt?.toISOString();
    this.createdAt = data.createdAt.toISOString();
    this.updatedAt = data.updatedAt.toISOString();
  }
}
