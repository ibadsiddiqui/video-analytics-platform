/**
 * Error Response DTO
 * Standardized error response format
 */

export class ErrorResponse {
  success: boolean = false;
  error!: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: any;
  };
  timestamp!: string;
  path?: string;
}
