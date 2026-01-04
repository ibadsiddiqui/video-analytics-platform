/**
 * HTTP Exception Filter
 * Global error handler for NestJS application
 * Replaces ErrorHandler middleware from routing-controllers
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '@domain/exceptions';

/**
 * HttpExceptionFilter - Catches all exceptions and formats them consistently
 *
 * Handles:
 * - Domain exceptions (from business logic)
 * - NestJS HttpException
 * - class-validator validation errors
 * - Network errors (ENOTFOUND, ECONNREFUSED)
 * - YouTube API quota errors
 * - All other errors (500)
 *
 * Response Format:
 * {
 *   success: false,
 *   error: "Error message",
 *   code: "ERROR_CODE",
 *   timestamp: "ISO timestamp",
 *   details?: any,  // For validation errors
 *   stack?: string  // In development only
 * }
 *
 * Usage:
 * // Apply globally in main.ts
 * app.useGlobalFilters(new HttpExceptionFilter());
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const request = ctx.getRequest<Request>();

    console.error('Error caught by HttpExceptionFilter:', exception);

    // Handle domain exceptions
    if (exception instanceof DomainException) {
      response.status(exception.statusCode).json(exception.toJSON());
      return;
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // If the response is already an object, use it
      if (typeof exceptionResponse === 'object') {
        response.status(status).json({
          success: false,
          timestamp: new Date().toISOString(),
          ...exceptionResponse,
        });
        return;
      }

      // Otherwise, format it
      response.status(status).json({
        success: false,
        error: exceptionResponse,
        code: exception.name || 'HTTP_ERROR',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle class-validator validation errors
    if (
      exception.name === 'BadRequestException' &&
      exception.response &&
      Array.isArray(exception.response.message)
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: exception.response.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle network errors
    if (exception.code === 'ENOTFOUND' || exception.code === 'ECONNREFUSED') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'External service unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle YouTube API quota errors
    if (exception.message?.includes('quotaExceeded')) {
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        error: 'API quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Default error response (500)
    const isProduction = process.env.NODE_ENV === 'production';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: isProduction ? 'An unexpected error occurred' : exception.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      ...(!isProduction && { stack: exception.stack }),
    });
  }
}
