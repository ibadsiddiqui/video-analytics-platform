/**
 * Video Analytics Platform - Backend API Server
 * NestJS + Clean Architecture + TypeScript
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { ConfigService } from '@shared/config/ConfigService';
import { HttpExceptionFilter } from '@presentation/filters/http-exception.filter';
import { LoggingInterceptor } from '@presentation/interceptors/logging.interceptor';

/**
 * Bootstrap NestJS Application
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // Security - Helmet middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable for API
    })
  );

  // CORS - Allow Clerk webhooks and frontend requests
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        configService.getFrontendUrl(),
        'http://localhost:3000',
        'http://localhost:5173',
        /\.vercel\.app$/,
        // Clerk webhook domains
        /\.clerk\.com$/,
        /\.clerk\.accounts\.dev$/,
      ];

      const allowed = allowedOrigins.some((allowed) => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });

      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      // Svix headers for Clerk webhook signature verification
      'svix-id',
      'svix-timestamp',
      'svix-signature',
      // Browser fingerprint for anonymous rate limiting
      'X-Fingerprint',
    ],
  });

  // Special handling for webhook routes - they need raw body for signature verification
  // MUST be before express.json() middleware
  app.use(
    '/api/auth/webhook',
    express.raw({ type: 'application/json' }),
    (req: any, _res: any, next: any) => {
      // Store raw body for Svix signature verification
      req.rawBody = req.body;
      next();
    }
  );

  // Parse JSON bodies (for non-webhook routes)
  app.use(express.json({ limit: '1mb' }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global prefix - all routes will be prefixed with /api
  app.setGlobalPrefix('api');

  // Global validation pipe - validates all DTOs with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: false, // Don't throw error for extra properties
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
    })
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter - handles all errors
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Video Analytics API')
    .setVersion('2.0.0')
    .setDescription(
      'API for analyzing YouTube and Instagram video metrics with comprehensive analytics, sentiment analysis, and engagement tracking.'
    )
    .setContact(
      'API Support',
      'https://github.com/your-username/video-analytics-platform',
      ''
    )
    .addServer('http://localhost:3001', 'Development server')
    .addServer('https://your-production-url.vercel.app', 'Production server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth'
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Analytics', 'Video analytics endpoints')
    .addTag('Authentication', 'User authentication and profile endpoints')
    .addTag('API Keys', 'User API key management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/spec-docs', app, document, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Video Analytics API Documentation',
    customfavIcon: '/favicon.ico',
  });

  // Serve OpenAPI JSON spec
  app.getHttpAdapter().get('/api/spec.json', (_req: any, res: any) => {
    res.json(document);
  });

  // Root endpoint (outside /api prefix)
  app.getHttpAdapter().get('/', (_req: any, res: any) => {
    res.json({
      name: 'Video Analytics API',
      version: '2.0.0-nestjs',
      description: 'Analyze YouTube and Instagram video metrics',
      architecture: 'NestJS + Clean Architecture',
      endpoints: {
        health: 'GET /api/health',
        analyze: 'POST /api/analyze | GET /api/analyze?url=...',
        compare: 'POST /api/compare',
        history: 'GET /api/history/:videoId?days=7',
        detectPlatform: 'POST /api/detect-platform | GET /api/detect-platform?url=...',
        auth: {
          webhook: 'POST /api/auth/webhook',
          me: 'GET /api/auth/me',
        },
        keys: {
          create: 'POST /api/keys',
          list: 'GET /api/keys',
          update: 'PUT /api/keys/:id',
          delete: 'DELETE /api/keys/:id',
          test: 'POST /api/keys/:id/test',
        },
      },
      documentation: '/api/spec-docs',
    });
  });

  // Only start server if not in serverless environment (Vercel)
  if (process.env.VERCEL !== '1') {
    const port = configService.getPort();
    const env = configService.getNodeEnv();

    await app.listen(port);
    console.log(`
╔══════════════════════════════════════════╗
║   Video Analytics API v2.0               ║
║   NestJS + Clean Architecture            ║
║   Running on http://localhost:${port}        ║
╚══════════════════════════════════════════╝

Environment: ${env}
Architecture: NestJS + Clean Architecture
Routing: NestJS Controllers
Documentation: http://localhost:${port}/api/spec-docs
    `);
  }

  return app;
}

// Cache app instance for Vercel serverless (reduces cold start time)
let cachedApp: NestExpressApplication;

// Export for Vercel serverless functions
export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  return cachedApp.getHttpAdapter().getInstance()(req, res);
};

// Bootstrap for local development
if (process.env.VERCEL !== '1') {
  bootstrap();
}
