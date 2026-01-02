/**
 * Test API Key Response DTO
 */

export class TestApiKeyResponse {
  valid!: boolean;
  error?: string;
  quotaRemaining?: number;
  message?: string;

  constructor(data: {
    valid: boolean;
    error?: string;
    quotaRemaining?: number;
    message?: string;
  }) {
    this.valid = data.valid;
    this.error = data.error;
    this.quotaRemaining = data.quotaRemaining;
    this.message = data.message;
  }
}
