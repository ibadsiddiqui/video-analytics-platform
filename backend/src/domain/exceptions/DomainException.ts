/**
 * Base Domain Exception
 * All domain-specific exceptions should extend this class
 */
export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: Date;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert exception to JSON response format
   */
  toJSON(): {
    success: false;
    error: string;
    code: string;
    timestamp: string;
  } {
    return {
      success: false,
      error: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
