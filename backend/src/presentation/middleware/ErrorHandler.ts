import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { DomainException } from '@domain/exceptions';

/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 */
@Service()
@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, _request: Request, response: Response, _next: NextFunction): void {
    console.error('Error caught by ErrorHandler:', error);

    // Handle domain exceptions
    if (error instanceof DomainException) {
      response.status(error.statusCode).json(error.toJSON());
      return;
    }

    // Handle validation errors from class-validator
    if (error.name === 'BadRequestError' && Array.isArray(error.errors)) {
      response.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle routing-controllers HTTP errors
    if (error.httpCode) {
      response.status(error.httpCode).json({
        success: false,
        error: error.message || 'An error occurred',
        code: error.name || 'HTTP_ERROR',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      response.status(503).json({
        success: false,
        error: 'External service unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle YouTube API quota errors
    if (error.message?.includes('quotaExceeded')) {
      response.status(429).json({
        success: false,
        error: 'API quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Default error response (500)
    const isProduction = process.env.NODE_ENV === 'production';
    response.status(500).json({
      success: false,
      error: isProduction ? 'An unexpected error occurred' : error.message,
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      ...((!isProduction) && { stack: error.stack }),
    });
  }
}
