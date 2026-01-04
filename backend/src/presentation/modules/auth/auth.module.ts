import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { json } from 'express';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { AuthGuard } from '@presentation/guards/auth.guard';

/**
 * Auth Module
 * Provides authentication endpoints and Clerk webhook handling
 *
 * CRITICAL: Implements raw body middleware for webhook signature verification
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthGuard],
})
export class AuthModule implements NestModule {
  /**
   * Configure middleware for the auth module
   * CRITICAL: Add raw body capture for webhook signature verification
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply raw body middleware to webhook endpoint
    // This captures the raw body string needed for Clerk's signature verification
    consumer
      .apply(
        json({
          verify: (req: Request, _res: Response, buf: Buffer) => {
            (req as any).rawBody = buf.toString('utf8');
          },
        })
      )
      .forRoutes('auth/webhook');
  }
}
