/**
 * Logging Interceptor
 * Logs HTTP requests with method, path, status code, and duration
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * LoggingInterceptor - Logs all HTTP requests
 *
 * Output Format: METHOD PATH - STATUS - DURATIONms
 * Example: GET /api/health - 200 - 5ms
 *
 * Flow:
 * 1. Capture start time when request begins
 * 2. Allow request to proceed through the pipeline
 * 3. When response is sent, calculate duration
 * 4. Log request details to console
 *
 * Usage:
 * // Apply globally in main.ts
 * app.useGlobalInterceptors(new LoggingInterceptor());
 *
 * // Or apply to specific controllers
 * @UseInterceptors(LoggingInterceptor)
 * @Controller('api')
 * export class ApiController {}
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log: METHOD PATH - STATUS - DURATIONms
        console.log(`${method} ${url} - ${statusCode} - ${duration}ms`);
      })
    );
  }
}
